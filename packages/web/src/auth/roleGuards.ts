import type { AuthUser } from './AuthProvider.js';

export type UserRoleType = AuthUser['roles'][number];

export function hasRole(user: AuthUser | null, role: UserRoleType): boolean {
  return Boolean(user?.roles.includes(role));
}

export function isAdministrator(user: AuthUser | null): boolean {
  return hasRole(user, 'ADMINISTRATOR');
}

export function isLeader(user: AuthUser | null): boolean {
  return hasRole(user, 'LEADER');
}
