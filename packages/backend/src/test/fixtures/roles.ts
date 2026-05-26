import { USER_ROLE_TYPES, type UserRoleType } from '../../auth/types.js';

export const collaboratorOnlyRoles: UserRoleType[] = [USER_ROLE_TYPES.COLLABORATOR];

export const collaboratorLeaderRoles: UserRoleType[] = [
  USER_ROLE_TYPES.COLLABORATOR,
  USER_ROLE_TYPES.LEADER,
];

export const collaboratorAdminRoles: UserRoleType[] = [
  USER_ROLE_TYPES.COLLABORATOR,
  USER_ROLE_TYPES.ADMINISTRATOR,
];

export const allRoles: UserRoleType[] = [
  USER_ROLE_TYPES.COLLABORATOR,
  USER_ROLE_TYPES.LEADER,
  USER_ROLE_TYPES.ADMINISTRATOR,
];
