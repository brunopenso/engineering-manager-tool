import { User } from '../database/entities/User.js';
import type { UserRoleType } from '../auth/types.js';
import { loadRolesForUser } from './roleService.js';

export type AuthUserResponse = {
  id: string;
  email: string;
  fullName: string;
  firstLoginAt: string;
  lastLoginAt: string;
  roles: UserRoleType[];
  themePreference: 'light' | 'dark';
  githubLogin: string | null;
};

export async function mapUserToAuthResponse(user: User): Promise<AuthUserResponse> {
  const roles = await loadRolesForUser(user.id);

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    firstLoginAt: user.firstLoginAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
    roles,
    themePreference: user.themePreference ?? 'light',
    githubLogin: user.githubLogin ?? null,
  };
}
