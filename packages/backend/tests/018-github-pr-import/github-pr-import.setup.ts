import type { UserRoleType } from '../../src/auth/types.js';

export const ADMIN_AUTH = {
  userId: 'admin-1',
  email: 'admin@example.com',
  fullName: 'Admin',
  roles: ['COLLABORATOR', 'ADMINISTRATOR'] as UserRoleType[],
};

export const SELF_AUTH = {
  userId: 'user-self',
  email: 'self@example.com',
  fullName: 'Self',
  roles: ['COLLABORATOR'] as UserRoleType[],
};

export const LEADER_AUTH = {
  userId: 'user-leader',
  email: 'leader@example.com',
  fullName: 'Leader',
  roles: ['COLLABORATOR', 'LEADER'] as UserRoleType[],
};

export const PEER_AUTH = {
  userId: 'user-peer',
  email: 'peer@example.com',
  fullName: 'Peer',
  roles: ['COLLABORATOR'] as UserRoleType[],
};

export function samplePullRequestDetails(overrides: Record<string, unknown> = {}) {
  return {
    githubPullRequestId: '1001',
    organization: 'acme',
    repository: 'widgets',
    repositoryId: '500',
    title: 'Fix widgets',
    body: 'Details',
    number: 42,
    changedFilesCount: 3,
    additionsCount: 10,
    deletionsCount: 2,
    sourceBranch: 'feature/fix',
    targetBranch: 'main',
    authorGithubLogin: 'alice-dev',
    mergedAt: new Date('2026-08-09T15:00:00.000Z'),
    url: 'https://github.com/acme/widgets/pull/42',
    ...overrides,
  };
}
