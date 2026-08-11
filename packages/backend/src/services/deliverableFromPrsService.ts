import { In } from 'typeorm';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { AppDataSource } from '../database/connection.js';
import { GithubImportedPullRequest } from '../database/entities/GithubImportedPullRequest.js';
import { User } from '../database/entities/User.js';
import { normalizeGithubLogin } from './githubPrImportDateRange.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PULL_REQUEST_IDS = 50;
const TITLE_MAX = 200;
const DESCRIPTION_MAX = 5000;
const ROLE_MAX = 500;
const IMPROVEMENT_MAX = 5000;
const TECHNICAL_MAX = 5000;
const USER_TAG_MAX = 64;
const USER_TAGS_MAX = 20;
const LINKS_MAX = 20;
const LINK_LABEL_MAX = 120;

export type BusinessImpactProposal = 'LOW' | 'MEDIUM' | 'HIGH' | 'TRANSFORMATIONAL';

export type DeliverableProposal = {
  title: string;
  description: string;
  roleInDeliverable: string;
  businessImpact: BusinessImpactProposal;
  improvementPoints: string;
  systemTagIds: string[];
  technicalDescription?: string | null;
  userTags?: string[];
  links?: { url: string; label?: string | null }[];
};

export type AnalyzeFromPullRequestsInput = {
  pullRequestIds: string[];
};

export type AnalyzeFromPullRequestsResult = {
  proposal: DeliverableProposal;
  sourcePullRequestIds: string[];
};

export class DeliverableFromPrsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeliverableFromPrsValidationError';
  }
}

export class DeliverableFromPrsForbiddenError extends Error {
  code = AUTH_ERROR_CODES.FORBIDDEN;

  constructor(message: string) {
    super(message);
    this.name = 'DeliverableFromPrsForbiddenError';
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  if (max <= 1) {
    return value.slice(0, max);
  }
  return `${value.slice(0, max - 1)}…`;
}

function sanitizeUserTag(value: string): string {
  return truncate(value.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, ''), USER_TAG_MAX);
}

export function validateAnalyzeFromPullRequestsInput(body: unknown): AnalyzeFromPullRequestsInput {
  if (!body || typeof body !== 'object') {
    throw new DeliverableFromPrsValidationError('Request body must be an object');
  }

  const candidate = body as Record<string, unknown>;
  if (!Array.isArray(candidate.pullRequestIds) || candidate.pullRequestIds.length === 0) {
    throw new DeliverableFromPrsValidationError('pullRequestIds must be a non-empty array');
  }

  if (candidate.pullRequestIds.length > MAX_PULL_REQUEST_IDS) {
    throw new DeliverableFromPrsValidationError(
      `pullRequestIds must contain at most ${MAX_PULL_REQUEST_IDS} items`,
    );
  }

  const pullRequestIds = candidate.pullRequestIds.map((id) => {
    if (typeof id !== 'string' || !id.trim()) {
      throw new DeliverableFromPrsValidationError('Each pullRequestId must be a non-empty string');
    }
    const trimmed = id.trim();
    if (!UUID_RE.test(trimmed)) {
      throw new DeliverableFromPrsValidationError('Each pullRequestId must be a valid UUID');
    }
    return trimmed;
  });

  return { pullRequestIds: [...new Set(pullRequestIds)] };
}

function isActorAuthorizedForPullRequest(
  pr: GithubImportedPullRequest,
  actorGithubLogin: string,
): boolean {
  const login = normalizeGithubLogin(actorGithubLogin);
  if (normalizeGithubLogin(pr.authorGithubLogin) === login) {
    return true;
  }
  if (
    (pr.comments ?? []).some((comment) => normalizeGithubLogin(comment.authorGithubLogin) === login)
  ) {
    return true;
  }
  if (
    (pr.reviews ?? []).some((review) => normalizeGithubLogin(review.reviewerGithubLogin) === login)
  ) {
    return true;
  }
  return false;
}

export function buildMockDeliverableProposal(
  pullRequests: GithubImportedPullRequest[],
  actorGithubLogin: string,
): DeliverableProposal {
  const ordered = [...pullRequests];
  const first = ordered[0]!;
  const extraCount = ordered.length - 1;
  const baseTitle = first.title.trim() || 'Deliverable from pull requests';
  const title =
    extraCount > 0
      ? truncate(`${baseTitle} (+${extraCount} more)`, TITLE_MAX)
      : truncate(baseTitle, TITLE_MAX);

  const descriptionParts = ordered.map((pr) => {
    const repo = `${pr.organization}/${pr.repository}`;
    const bodySnippet = pr.body?.trim() ? truncate(pr.body.trim(), 280) : '';
    return bodySnippet
      ? `- #${pr.number} ${pr.title} (${repo}): ${bodySnippet}`
      : `- #${pr.number} ${pr.title} (${repo})`;
  });
  const description = truncate(
    `Proposed deliverable based on ${ordered.length} pull request(s):\n${descriptionParts.join('\n')}`,
    DESCRIPTION_MAX,
  );

  const actorIsAuthor = ordered.some(
    (pr) => normalizeGithubLogin(pr.authorGithubLogin) === normalizeGithubLogin(actorGithubLogin),
  );
  const roleInDeliverable = truncate(actorIsAuthor ? 'Author' : 'Contributor', ROLE_MAX);

  const improvementPoints = truncate(
    'Review and complement this deliverable with personal performance improvement points based on the selected pull requests.',
    IMPROVEMENT_MAX,
  );

  const technicalDescription = truncate(
    ordered
      .map((pr) => `${pr.organization}/${pr.repository}: ${pr.sourceBranch} → ${pr.targetBranch}`)
      .join('\n'),
    TECHNICAL_MAX,
  );

  const userTags = [
    ...new Set(
      ordered
        .map((pr) => sanitizeUserTag(pr.repository))
        .filter((tag) => tag.length > 0)
        .slice(0, USER_TAGS_MAX),
    ),
  ];

  const links = ordered
    .filter((pr) => typeof pr.url === 'string' && /^https?:\/\//i.test(pr.url))
    .slice(0, LINKS_MAX)
    .map((pr) => ({
      url: pr.url as string,
      label: truncate(`#${pr.number} ${pr.title}`, LINK_LABEL_MAX),
    }));

  return {
    title,
    description,
    roleInDeliverable,
    businessImpact: 'MEDIUM',
    improvementPoints,
    systemTagIds: [],
    technicalDescription: technicalDescription || null,
    userTags,
    links,
  };
}

export async function analyzeDeliverableFromPullRequests(
  actorUserId: string,
  input: AnalyzeFromPullRequestsInput,
): Promise<AnalyzeFromPullRequestsResult> {
  const actor = await AppDataSource.getRepository(User).findOne({ where: { id: actorUserId } });
  const rawLogin = actor?.githubLogin?.trim();
  if (!rawLogin) {
    throw new DeliverableFromPrsForbiddenError(
      'One or more pull requests were not found or are not accessible.',
    );
  }

  const pullRequests = await AppDataSource.getRepository(GithubImportedPullRequest).find({
    where: { id: In(input.pullRequestIds) },
    relations: { comments: true, reviews: true },
  });

  if (pullRequests.length !== input.pullRequestIds.length) {
    throw new DeliverableFromPrsForbiddenError(
      'One or more pull requests were not found or are not accessible.',
    );
  }

  for (const pr of pullRequests) {
    if (!isActorAuthorizedForPullRequest(pr, rawLogin)) {
      throw new DeliverableFromPrsForbiddenError(
        'One or more pull requests were not found or are not accessible.',
      );
    }
  }

  const byId = new Map(pullRequests.map((pr) => [pr.id, pr]));
  const ordered = input.pullRequestIds.map((id) => byId.get(id)!);

  return {
    proposal: buildMockDeliverableProposal(ordered, rawLogin),
    sourcePullRequestIds: input.pullRequestIds,
  };
}
