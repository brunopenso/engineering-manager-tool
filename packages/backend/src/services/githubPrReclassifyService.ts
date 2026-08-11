import { AUTH_ERROR_CODES } from '../auth/types.js';
import { AppDataSource } from '../database/connection.js';
import { GithubImportedPullRequest } from '../database/entities/GithubImportedPullRequest.js';
import { User } from '../database/entities/User.js';
import {
  PULL_REQUEST_CLASSIFICATION_TYPES,
  type PullRequestClassificationType,
} from './githubPrClassification.js';
import { normalizeGithubLogin } from './githubPrImportDateRange.js';
import {
  GithubPrQueryValidationError,
  isActorInvolvedInPullRequest,
  mapImportedPullRequest,
  type ImportedPullRequestDto,
} from './githubPrQueryService.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ReclassifyPullRequestsInput = {
  pullRequestIds: string[];
  classification: PullRequestClassificationType;
};

export type ReclassifyPullRequestsResult = {
  updatedCount: number;
  pullRequests: ImportedPullRequestDto[];
};

export function listClassificationTypes(): PullRequestClassificationType[] {
  return [...PULL_REQUEST_CLASSIFICATION_TYPES];
}

export function validateReclassifyPullRequestsInput(body: unknown): ReclassifyPullRequestsInput {
  if (!body || typeof body !== 'object') {
    throw new GithubPrQueryValidationError('Request body must be an object');
  }
  const candidate = body as Record<string, unknown>;

  if (!Array.isArray(candidate.pullRequestIds) || candidate.pullRequestIds.length === 0) {
    throw new GithubPrQueryValidationError('pullRequestIds must be a non-empty array');
  }

  const pullRequestIds = candidate.pullRequestIds.map((id) => {
    if (typeof id !== 'string' || !id.trim()) {
      throw new GithubPrQueryValidationError('Each pullRequestId must be a non-empty string');
    }
    const trimmed = id.trim();
    if (!UUID_RE.test(trimmed)) {
      throw new GithubPrQueryValidationError('Each pullRequestId must be a valid UUID');
    }
    return trimmed;
  });

  const uniqueIds = [...new Set(pullRequestIds)];

  if (typeof candidate.classification !== 'string' || !candidate.classification.trim()) {
    throw new GithubPrQueryValidationError('classification is required');
  }

  const classification = candidate.classification.trim() as PullRequestClassificationType;
  if (!PULL_REQUEST_CLASSIFICATION_TYPES.includes(classification)) {
    throw new GithubPrQueryValidationError(
      `classification must be one of: ${PULL_REQUEST_CLASSIFICATION_TYPES.join(', ')}`,
    );
  }

  return { pullRequestIds: uniqueIds, classification };
}

export class GithubPrReclassifyForbiddenError extends Error {
  code = AUTH_ERROR_CODES.FORBIDDEN;

  constructor(message = 'You do not have permission to reclassify one or more pull requests.') {
    super(message);
    this.name = AUTH_ERROR_CODES.FORBIDDEN;
  }
}

export async function reclassifyPullRequests(
  actorUserId: string,
  input: ReclassifyPullRequestsInput,
): Promise<ReclassifyPullRequestsResult> {
  const actor = await AppDataSource.getRepository(User).findOne({ where: { id: actorUserId } });
  const rawLogin = actor?.githubLogin?.trim();
  if (!rawLogin) {
    throw new GithubPrReclassifyForbiddenError(
      'GitHub login is required to reclassify pull requests.',
    );
  }

  const login = normalizeGithubLogin(rawLogin);
  const prRepo = AppDataSource.getRepository(GithubImportedPullRequest);
  const pullRequests = await prRepo
    .createQueryBuilder('pr')
    .leftJoinAndSelect('pr.comments', 'comments')
    .leftJoinAndSelect('pr.reviews', 'reviews')
    .where('pr.id IN (:...ids)', { ids: input.pullRequestIds })
    .getMany();

  if (pullRequests.length !== input.pullRequestIds.length) {
    throw new GithubPrReclassifyForbiddenError(
      'One or more pull requests were not found or are not accessible.',
    );
  }

  for (const pr of pullRequests) {
    const dto = mapImportedPullRequest(pr);
    if (!isActorInvolvedInPullRequest(dto, login)) {
      throw new GithubPrReclassifyForbiddenError(
        'You do not have permission to reclassify one or more pull requests.',
      );
    }
  }

  for (const pr of pullRequests) {
    pr.userReclassification = input.classification;
  }
  const saved = await prRepo.save(pullRequests);

  return {
    updatedCount: saved.length,
    pullRequests: saved.map(mapImportedPullRequest),
  };
}
