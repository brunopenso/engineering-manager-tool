import type { UserRoleType } from '../../src/auth/types.js';

export const profileActorId = 'profile-actor-1';

export const sampleProfileUser = {
  id: profileActorId,
  email: 'profile.actor@example.com',
  fullName: 'Profile Actor',
  themePreference: 'light' as const,
  githubLogin: null as string | null,
  firstLoginAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: new Date('2026-01-02T00:00:00.000Z'),
};

export const profileAuthRoles: UserRoleType[] = ['COLLABORATOR'];

export function toAuthUserResponse(user: typeof sampleProfileUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    firstLoginAt: user.firstLoginAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
    roles: profileAuthRoles,
    themePreference: user.themePreference,
    githubLogin: user.githubLogin,
  };
}
