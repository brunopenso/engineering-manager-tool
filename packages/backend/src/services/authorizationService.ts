import {
  AUTH_ERROR_CODES,
  USER_ROLE_TYPES,
  type ElevatedRoleType,
  type UserRoleType,
} from '../auth/types.js';
import { isOrganizationalDescendantOf } from './organizationalHierarchy.js';

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

export function assertLeaderRole(roles: UserRoleType[]): void {
  if (!hasLeaderRole(roles)) {
    const error = new Error('Leader role is required');
    error.name = AUTH_ERROR_CODES.LEADER_REQUIRED;
    throw error;
  }
}

export function assertLeaderForHierarchyManagement(roles: UserRoleType[]): void {
  assertLeaderRole(roles);
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

export async function canReadDeliverablesForOwner(
  actorUserId: string,
  ownerUserId: string,
): Promise<boolean> {
  if (actorUserId === ownerUserId) {
    return true;
  }

  return isOrganizationalDescendantOf(ownerUserId, actorUserId);
}

export function assertCanMutateDeliverable(actorUserId: string, ownerUserId: string): void {
  if (actorUserId !== ownerUserId) {
    const error = new Error('Only the deliverable owner can modify this record.');
    error.name = AUTH_ERROR_CODES.DELIVERABLE_FORBIDDEN;
    throw error;
  }
}

export async function assertCanReadDeliverables(
  actorUserId: string,
  ownerUserId: string,
): Promise<void> {
  if (!(await canReadDeliverablesForOwner(actorUserId, ownerUserId))) {
    const error = new Error('You do not have permission to view these deliverables.');
    error.name = AUTH_ERROR_CODES.DELIVERABLE_FORBIDDEN;
    throw error;
  }
}

/**
 * Hierarchical visibility for imported GitHub PR data.
 * Self + recursive subordinates; administrators may access any collaborator.
 */
export async function assertCanReadGithubImportedDataForUser(
  actorUserId: string,
  actorRoles: UserRoleType[],
  targetUserId: string,
): Promise<void> {
  if (hasAdministratorRole(actorRoles)) {
    return;
  }
  if (await canReadDeliverablesForOwner(actorUserId, targetUserId)) {
    return;
  }
  const error = new Error('You do not have permission to view this GitHub activity.');
  error.name = AUTH_ERROR_CODES.FORBIDDEN;
  throw error;
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
