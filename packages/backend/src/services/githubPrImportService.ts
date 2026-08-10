import { IsNull, Not } from 'typeorm';
import { AppDataSource } from '../database/connection.js';
import { GithubImportedPullRequest } from '../database/entities/GithubImportedPullRequest.js';
import { GithubPullRequestComment } from '../database/entities/GithubPullRequestComment.js';
import { GithubPullRequestReview } from '../database/entities/GithubPullRequestReview.js';
import { GithubIntegration } from '../database/entities/GithubIntegration.js';
import { User } from '../database/entities/User.js';
import {
  createGithubApiClientFromEnv,
  type GithubApiClient,
  type GithubPullRequestDetails,
} from './githubApiClient.js';
import {
  findCollectionControl,
  shouldSkipSuccessfulCollection,
  upsertCollectionControl,
} from './githubPrCollectionControlService.js';
import {
  githubLoginsMatch,
  type ImportDateRange,
} from './githubPrImportDateRange.js';

export type ImportRunSummary = {
  processed: number;
  succeeded: number;
  skipped: number;
  failed: number;
  pullRequestsImported: number;
  failures: Array<{ collaboratorId: string; organization: string; error: string }>;
};

export type GithubPrImportDeps = {
  apiClient: GithubApiClient;
  listUsersWithGithubLogin: () => Promise<Array<Pick<User, 'id' | 'githubLogin'>>>;
  listEnabledOrganizations: () => Promise<string[]>;
  findControl: typeof findCollectionControl;
  upsertControl: typeof upsertCollectionControl;
  upsertPullRequestBundle: (
    collaboratorId: string,
    details: GithubPullRequestDetails,
    comments: Awaited<ReturnType<GithubApiClient['listIssueComments']>>,
    reviews: Awaited<ReturnType<GithubApiClient['listReviews']>>,
  ) => Promise<void>;
};

function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/ghp_[A-Za-z0-9]+/g, '[redacted]').replace(/github_pat_[A-Za-z0-9_]+/g, '[redacted]');
}

async function defaultListUsersWithGithubLogin(): Promise<Array<Pick<User, 'id' | 'githubLogin'>>> {
  const users = await AppDataSource.getRepository(User).find({
    where: { githubLogin: Not(IsNull()) },
  });
  return users.filter((user) => Boolean(user.githubLogin?.trim()));
}

async function defaultListEnabledOrganizations(): Promise<string[]> {
  const orgs = await AppDataSource.getRepository(GithubIntegration).find();
  return orgs.map((org) => org.organizationName);
}

async function defaultUpsertPullRequestBundle(
  collaboratorId: string,
  details: GithubPullRequestDetails,
  comments: Awaited<ReturnType<GithubApiClient['listIssueComments']>>,
  reviews: Awaited<ReturnType<GithubApiClient['listReviews']>>,
): Promise<void> {
  const prRepo = AppDataSource.getRepository(GithubImportedPullRequest);
  const commentRepo = AppDataSource.getRepository(GithubPullRequestComment);
  const reviewRepo = AppDataSource.getRepository(GithubPullRequestReview);

  let pr = await prRepo.findOne({ where: { githubPullRequestId: details.githubPullRequestId } });
  if (!pr) {
    pr = prRepo.create({
      githubPullRequestId: details.githubPullRequestId,
      collaboratorId,
    });
  }

  pr.organization = details.organization;
  pr.repository = details.repository;
  pr.repositoryId = details.repositoryId;
  pr.title = details.title;
  pr.body = details.body;
  pr.number = details.number;
  pr.changedFilesCount = details.changedFilesCount;
  pr.additionsCount = details.additionsCount;
  pr.deletionsCount = details.deletionsCount;
  pr.sourceBranch = details.sourceBranch;
  pr.targetBranch = details.targetBranch;
  pr.authorGithubLogin = details.authorGithubLogin;
  pr.mergedAt = details.mergedAt;
  pr.url = details.url;
  pr.collaboratorId = collaboratorId;
  pr = await prRepo.save(pr);

  for (const comment of comments) {
    let row = await commentRepo.findOne({ where: { githubCommentId: comment.githubCommentId } });
    if (!row) {
      row = commentRepo.create({ githubCommentId: comment.githubCommentId, pullRequestId: pr.id });
    }
    row.pullRequestId = pr.id;
    row.authorGithubLogin = comment.authorGithubLogin;
    row.body = comment.body;
    row.createdAtGithub = comment.createdAt;
    row.updatedAtGithub = comment.updatedAt;
    row.url = comment.url;
    await commentRepo.save(row);
  }

  for (const review of reviews) {
    let row = await reviewRepo.findOne({ where: { githubReviewId: review.githubReviewId } });
    if (!row) {
      row = reviewRepo.create({ githubReviewId: review.githubReviewId, pullRequestId: pr.id });
    }
    row.pullRequestId = pr.id;
    row.reviewerGithubLogin = review.reviewerGithubLogin;
    row.body = review.body;
    row.state = review.state;
    row.createdAtGithub = review.createdAt;
    row.updatedAtGithub = review.updatedAt;
    row.url = review.url;
    await reviewRepo.save(row);
  }
}

export function createDefaultGithubPrImportDeps(
  apiClient: GithubApiClient = createGithubApiClientFromEnv(),
): GithubPrImportDeps {
  return {
    apiClient,
    listUsersWithGithubLogin: defaultListUsersWithGithubLogin,
    listEnabledOrganizations: defaultListEnabledOrganizations,
    findControl: findCollectionControl,
    upsertControl: upsertCollectionControl,
    upsertPullRequestBundle: defaultUpsertPullRequestBundle,
  };
}

function mergedAtWithinInclusiveUtcRange(mergedAt: Date, range: ImportDateRange): boolean {
  const day = mergedAt.toISOString().slice(0, 10);
  return day >= range.startDate && day <= range.endDate;
}

export async function runGithubPrImport(
  range: ImportDateRange,
  deps: GithubPrImportDeps = createDefaultGithubPrImportDeps(),
): Promise<ImportRunSummary> {
  const summary: ImportRunSummary = {
    processed: 0,
    succeeded: 0,
    skipped: 0,
    failed: 0,
    pullRequestsImported: 0,
    failures: [],
  };

  const users = await deps.listUsersWithGithubLogin();
  const organizations = await deps.listEnabledOrganizations();

  if (organizations.length === 0) {
    return summary;
  }

  for (const user of users) {
    const githubLogin = user.githubLogin?.trim();
    if (!githubLogin) {
      continue;
    }

    for (const organization of organizations) {
      summary.processed += 1;
      const key = {
        collaboratorId: user.id,
        githubLogin,
        organization,
        startDate: range.startDate,
        endDate: range.endDate,
      };

      const existing = await deps.findControl({
        collaboratorId: user.id,
        organization,
        startDate: range.startDate,
        endDate: range.endDate,
      });

      if (shouldSkipSuccessfulCollection(existing)) {
        summary.skipped += 1;
        continue;
      }

      try {
        const hits = await deps.apiClient.searchMergedPullRequests({
          authorLogin: githubLogin,
          organization,
          startDate: range.startDate,
          endDate: range.endDate,
        });

        for (const hit of hits) {
          const details = await deps.apiClient.getPullRequest(
            hit.organization,
            hit.repository,
            hit.number,
          );

          if (!githubLoginsMatch(details.authorGithubLogin, githubLogin)) {
            continue;
          }
          if (details.organization.toLowerCase() !== organization.toLowerCase()) {
            continue;
          }
          if (!mergedAtWithinInclusiveUtcRange(details.mergedAt, range)) {
            continue;
          }

          const comments = await deps.apiClient.listIssueComments(
            hit.organization,
            hit.repository,
            hit.number,
          );
          const reviews = await deps.apiClient.listReviews(
            hit.organization,
            hit.repository,
            hit.number,
          );
          await deps.upsertPullRequestBundle(user.id, details, comments, reviews);
          summary.pullRequestsImported += 1;
        }

        await deps.upsertControl(key, 'success', null);
        summary.succeeded += 1;
      } catch (error) {
        const message = sanitizeErrorMessage(error);
        await deps.upsertControl(key, 'failed', message);
        summary.failed += 1;
        summary.failures.push({
          collaboratorId: user.id,
          organization,
          error: message,
        });
      }
    }
  }

  return summary;
}
