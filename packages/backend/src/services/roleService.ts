import { AppDataSource } from '../database/connection.js';
import { RoleAssignmentEvent } from '../database/entities/RoleAssignmentEvent.js';
import { UserRole } from '../database/entities/UserRole.js';
import {
  USER_ROLE_TYPES,
  type ElevatedRoleType,
  type RoleChangeAction,
  type UserRoleType,
} from '../auth/types.js';
import {
  isElevatedRole,
  rejectCollaboratorRoleChange,
} from './authorizationService.js';

const userRoleRepository = () => AppDataSource.getRepository(UserRole);
const roleAssignmentEventRepository = () =>
  AppDataSource.getRepository(RoleAssignmentEvent);

const ROLE_SORT_ORDER: UserRoleType[] = [
  USER_ROLE_TYPES.COLLABORATOR,
  USER_ROLE_TYPES.LEADER,
  USER_ROLE_TYPES.ADMINISTRATOR,
];

export function sortRoles(roles: UserRoleType[]): UserRoleType[] {
  return [...roles].sort(
    (left, right) => ROLE_SORT_ORDER.indexOf(left) - ROLE_SORT_ORDER.indexOf(right),
  );
}

export async function loadRolesForUser(userId: string): Promise<UserRoleType[]> {
  const rows = await userRoleRepository().find({
    where: { userId },
    select: ['role'],
  });

  const roles = rows.map((row) => row.role);

  if (!roles.includes(USER_ROLE_TYPES.COLLABORATOR)) {
    return sortRoles([USER_ROLE_TYPES.COLLABORATOR, ...roles]);
  }

  return sortRoles(roles);
}

export async function ensureCollaboratorRole(userId: string): Promise<void> {
  const existing = await userRoleRepository().findOne({
    where: { userId, role: USER_ROLE_TYPES.COLLABORATOR },
  });

  if (existing) {
    return;
  }

  await userRoleRepository().save(
    userRoleRepository().create({
      userId,
      role: USER_ROLE_TYPES.COLLABORATOR,
    }),
  );
}

export async function applyRoleChange(
  actorUserId: string,
  targetUserId: string,
  role: ElevatedRoleType,
  action: RoleChangeAction,
): Promise<UserRoleType[]> {
  rejectCollaboratorRoleChange(role);

  if (!isElevatedRole(role)) {
    throw new Error(`Unsupported role: ${role}`);
  }

  await ensureCollaboratorRole(targetUserId);

  const existing = await userRoleRepository().findOne({
    where: { userId: targetUserId, role },
  });

  if (action === 'GRANT') {
    if (!existing) {
      await userRoleRepository().save(
        userRoleRepository().create({
          userId: targetUserId,
          role,
        }),
      );

      await roleAssignmentEventRepository().save(
        roleAssignmentEventRepository().create({
          targetUserId,
          actorUserId,
          role,
          action,
        }),
      );
    }
  } else if (action === 'REVOKE') {
    if (existing) {
      await userRoleRepository().remove(existing);

      await roleAssignmentEventRepository().save(
        roleAssignmentEventRepository().create({
          targetUserId,
          actorUserId,
          role,
          action,
        }),
      );
    }
  }

  return loadRolesForUser(targetUserId);
}
