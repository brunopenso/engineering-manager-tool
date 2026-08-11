import type { MyActivityPullRequest } from '../../src/services/myPullRequestsApi.js';

export function sampleActivityPr(
  overrides: Partial<MyActivityPullRequest> = {},
): MyActivityPullRequest {
  const classificationType =
    'classificationType' in overrides ? (overrides.classificationType ?? null) : 'fix';
  const userReclassification =
    'userReclassification' in overrides
      ? (overrides.userReclassification ?? null)
      : classificationType;

  return {
    id: 'pr-1',
    githubPullRequestId: '1001',
    organization: 'acme',
    repository: 'widgets',
    repositoryId: '500',
    title: 'Fix widgets',
    body: 'Details',
    number: 42,
    changedFilesCount: 2,
    additionsCount: 10,
    deletionsCount: 1,
    sourceBranch: 'feature/fix',
    targetBranch: 'main',
    authorGithubLogin: 'alice-dev',
    mergedAt: '2026-08-01T12:00:00.000Z',
    url: 'https://github.com/acme/widgets/pull/42',
    complexityIndex: 2,
    comments: [],
    reviews: [],
    involvementRole: 'owner',
    ...overrides,
    classificationType,
    userReclassification,
  };
}
