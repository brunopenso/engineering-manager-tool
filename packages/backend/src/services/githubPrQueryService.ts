import type { UserRoleType } from '../auth/types.js';
import { AppDataSource } from '../database/connection.js';
import { GithubImportedPullRequest } from '../database/entities/GithubImportedPullRequest.js';
import { User } from '../database/entities/User.js';
import { assertCanReadGithubImportedDataForUser } from './authorizationService.js';
import { normalizeGithubLogin } from './githubPrImportDateRange.js';

export { assertCanReadGithubImportedDataForUser } from './authorizationService.js';

export type GithubPullRequestQueryInput = {
  githubLogins: string[];
  startDate: string;
  endDate: string;
};

export type ImportedPullRequestCommentDto = {
  id: string;
  githubCommentId: string;
  authorGithubLogin: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  url: string | null;
};

export type ImportedPullRequestReviewDto = {
  id: string;
  githubReviewId: string;
  reviewerGithubLogin: string;
  body: string | null;
  state: string;
  createdAt: string;
  updatedAt: string | null;
  url: string | null;
};

export type ImportedPullRequestDto = {
  id: string;
  githubPullRequestId: string;
  organization: string;
  repository: string;
  repositoryId: string;
  title: string;
  body: string | null;
  number: number;
  changedFilesCount: number;
  additionsCount: number;
  deletionsCount: number;
  sourceBranch: string;
  targetBranch: string;
  authorGithubLogin: string;
  mergedAt: string;
  url: string | null;
  comments: ImportedPullRequestCommentDto[];
  reviews: ImportedPullRequestReviewDto[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class GithubPrQueryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GithubPrQueryValidationError';
  }
}

export function validateGithubPullRequestQueryInput(
  body: unknown,
): GithubPullRequestQueryInput {
  if (!body || typeof body !== 'object') {
    throw new GithubPrQueryValidationError('Request body must be an object');
  }
  const candidate = body as Record<string, unknown>;
  if (!Array.isArray(candidate.githubLogins) || candidate.githubLogins.length === 0) {
    throw new GithubPrQueryValidationError('githubLogins must be a non-empty array');
  }
  const githubLogins = candidate.githubLogins.map((login) => {
    if (typeof login !== 'string' || !login.trim()) {
      throw new GithubPrQueryValidationError('Each githubLogin must be a non-empty string');
    }
    if (login.trim().length > 39) {
      throw new GithubPrQueryValidationError('githubLogin must be at most 39 characters');
    }
    return login.trim();
  });

  if (typeof candidate.startDate !== 'string' || !ISO_DATE.test(candidate.startDate)) {
    throw new GithubPrQueryValidationError('startDate must be YYYY-MM-DD');
  }
  if (typeof candidate.endDate !== 'string' || !ISO_DATE.test(candidate.endDate)) {
    throw new GithubPrQueryValidationError('endDate must be YYYY-MM-DD');
  }
  if (candidate.endDate < candidate.startDate) {
    throw new GithubPrQueryValidationError('endDate must be on or after startDate');
  }

  return {
    githubLogins,
    startDate: candidate.startDate,
    endDate: candidate.endDate,
  };
}

export async function queryImportedPullRequests(
  actorUserId: string,
  actorRoles: UserRoleType[],
  input: GithubPullRequestQueryInput,
): Promise<ImportedPullRequestDto[]> {
  const allWithLogin = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('user.github_login IS NOT NULL')
    .andWhere("user.github_login <> ''")
    .getMany();

  const wanted = new Set(input.githubLogins.map(normalizeGithubLogin));
  const matchedUsers = allWithLogin.filter(
    (user) => user.githubLogin && wanted.has(normalizeGithubLogin(user.githubLogin)),
  );

  for (const user of matchedUsers) {
    await assertCanReadGithubImportedDataForUser(actorUserId, actorRoles, user.id);
  }

  if (matchedUsers.length === 0) {
    return [];
  }

  const start = new Date(`${input.startDate}T00:00:00.000Z`);
  const end = new Date(`${input.endDate}T23:59:59.999Z`);
  const collaboratorIds = matchedUsers.map((user) => user.id);

  const pullRequests = await AppDataSource.getRepository(GithubImportedPullRequest)
    .createQueryBuilder('pr')
    .leftJoinAndSelect('pr.comments', 'comments')
    .leftJoinAndSelect('pr.reviews', 'reviews')
    .where('pr.collaborator_id IN (:...collaboratorIds)', { collaboratorIds })
    .andWhere('pr.merged_at BETWEEN :start AND :end', { start, end })
    .orderBy('pr.merged_at', 'DESC')
    .getMany();

  return pullRequests
    .filter((pr) => {
      const day = pr.mergedAt.toISOString().slice(0, 10);
      return day >= input.startDate && day <= input.endDate;
    })
    .map(mapImportedPullRequest);
}

export function mapImportedPullRequest(pr: GithubImportedPullRequest): ImportedPullRequestDto {
  return {
    id: pr.id,
    githubPullRequestId: pr.githubPullRequestId,
    organization: pr.organization,
    repository: pr.repository,
    repositoryId: pr.repositoryId,
    title: pr.title,
    body: pr.body,
    number: pr.number,
    changedFilesCount: pr.changedFilesCount,
    additionsCount: pr.additionsCount,
    deletionsCount: pr.deletionsCount,
    sourceBranch: pr.sourceBranch,
    targetBranch: pr.targetBranch,
    authorGithubLogin: pr.authorGithubLogin,
    mergedAt: pr.mergedAt.toISOString(),
    url: pr.url,
    comments: (pr.comments ?? []).map((comment) => ({
      id: comment.id,
      githubCommentId: comment.githubCommentId,
      authorGithubLogin: comment.authorGithubLogin,
      body: comment.body,
      createdAt: comment.createdAtGithub.toISOString(),
      updatedAt: comment.updatedAtGithub.toISOString(),
      url: comment.url,
    })),
    reviews: (pr.reviews ?? []).map((review) => ({
      id: review.id,
      githubReviewId: review.githubReviewId,
      reviewerGithubLogin: review.reviewerGithubLogin,
      body: review.body,
      state: review.state,
      createdAt: review.createdAtGithub.toISOString(),
      updatedAt: review.updatedAtGithub ? review.updatedAtGithub.toISOString() : null,
      url: review.url,
    })),
  };
}
