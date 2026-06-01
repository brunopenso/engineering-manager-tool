import type { UserRoleType } from '../../src/auth/types.js';

export const adminActorId = 'admin-filter-actor';

export const sampleAdminListUser = {
  id: 'user-alice',
  email: 'alice@example.com',
  fullName: 'Alice Example',
  firstLoginAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: new Date('2026-01-02T00:00:00.000Z'),
};

export const sampleLeaderUser = {
  id: 'user-bob',
  email: 'bob.leader@example.com',
  fullName: 'Bob Leader',
  firstLoginAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: new Date('2026-01-02T00:00:00.000Z'),
};

export const adminListAuthRoles: UserRoleType[] = ['COLLABORATOR', 'ADMINISTRATOR'];
