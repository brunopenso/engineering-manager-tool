import { USER_ROLE_TYPES, type UserRoleType } from '../../auth/types.js';

export const leaderRoles: UserRoleType[] = [
  USER_ROLE_TYPES.COLLABORATOR,
  USER_ROLE_TYPES.LEADER,
];

export const nonLeaderRoles: UserRoleType[] = [USER_ROLE_TYPES.COLLABORATOR];
