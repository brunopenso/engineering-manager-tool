import {
  AUTH_ERROR_CODES,
  USER_ROLE_TYPES,
  type ElevatedRoleType,
  type UserRoleType,
} from '../auth/types.js';

export function hasRole(roles: UserRoleType[], role: UserRoleType): boolean {
  return roles.includes(role);
}

export function hasAdministratorRole(roles: UserRoleType[]): boolean {
  return hasRole(roles, USER_ROLE_TYPES.ADMINISTRATOR);
}

export function hasLeaderRole(roles: UserRoleType[]): boolean {
  return hasRole(roles, USER_ROLE_TYPES.LEADER);
}

export function assertAdministrator(roles: UserRoleType[]): void {
  if (!hasAdministratorRole(roles)) {
    const error = new Error('Administrator role is required');
    error.name = AUTH_ERROR_CODES.FORBIDDEN;
    throw error;
  }
}

export function assertLeader(roles: UserRoleType[]): boolean {
  return hasLeaderRole(roles);
}

/**
 * Extension point for constitution VII hierarchical visibility.
 * When reporting relationships exist, resolve descendant user IDs here and
 * enforce self + recursive subordinates only.
 */
export function canAccessOrganizationalDataForTarget(
  _actorRoles: UserRoleType[],
  _targetUserId: string,
  _actorUserId: string,
): boolean {
  // Org hierarchy not persisted yet; leader gate is role-only until subtree resolver ships.
  return false;
}

export function isElevatedRole(role: string): role is ElevatedRoleType {
  return role === USER_ROLE_TYPES.LEADER || role === USER_ROLE_TYPES.ADMINISTRATOR;
}

export function rejectCollaboratorRoleChange(role: string): void {
  if (role === USER_ROLE_TYPES.COLLABORATOR) {
    const error = new Error('Collaborator role cannot be granted or revoked');
    error.name = AUTH_ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }
}
