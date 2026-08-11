import type { MyActivityPullRequest } from '../../src/services/myPullRequestsApi.js';

export function sampleActivityPr(
  overrides: Partial<MyActivityPullRequest> = {},
): MyActivityPullRequest {
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
    comments: [],
    reviews: [],
    involvementRole: 'owner',
    ...overrides,
  };
}
