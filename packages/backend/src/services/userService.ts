import { AppDataSource } from '../database/connection.js';
import { User } from '../database/entities/User.js';
import { UserCreationAudit } from '../database/entities/UserCreationAudit.js';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { ensureCollaboratorRole } from './roleService.js';
import {
  normalizeLeaderCreateInput,
  type LeaderCreateUserInput,
} from './userCreateValidation.js';
import type {
  HierarchyAssignResult,
  HierarchyAssignmentAuditEvent,
  HierarchyOrphanUserSummary,
  HierarchySearchInput,
} from '../types/hierarchyManagement.js';
import type {
  HierarchyDescendantRow,
  LeaderHierarchyViewResponse,
} from '../types/hierarchyView.js';
import {
  buildHierarchyTreeFromRows,
  toHierarchyViewNode,
} from './hierarchyViewBuilder.js';

export { toHierarchyDisplayName } from './hierarchyViewBuilder.js';

type GoogleIdentity = {
  email: string;
  fullName: string;
};

const userRepository = () => AppDataSource.getRepository(User);
const userCreationAuditRepository = () => AppDataSource.getRepository(UserCreationAudit);

export async function upsertUserFromGoogleIdentity(
  identity: GoogleIdentity,
): Promise<User> {
  const normalizedEmail = identity.email.trim().toLowerCase();
  const now = new Date();

  const existingUser = await userRepository().findOne({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    existingUser.fullName = identity.fullName;
    existingUser.lastLoginAt = now;
    const savedUser = await userRepository().save(existingUser);
    await ensureCollaboratorRole(savedUser.id);
    return savedUser;
  }

  const createdUser = userRepository().create({
    email: normalizedEmail,
    fullName: identity.fullName,
    firstLoginAt: now,
    lastLoginAt: now,
  });

  const savedUser = await userRepository().save(createdUser);
  await ensureCollaboratorRole(savedUser.id);
  return savedUser;
}

export async function findAllUsers(): Promise<User[]> {
  return userRepository().find({ order: { email: 'ASC' } });
}

export async function findUserById(id: string): Promise<User | null> {
  return userRepository().findOne({ where: { id } });
}

export type CreatedUserByLeader = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  leaderId: string;
  createdByUserId: string;
  createdAt: string;
};

export async function createUserByLeader(
  actorUserId: string,
  input: LeaderCreateUserInput,
): Promise<CreatedUserByLeader> {
  const normalized = normalizeLeaderCreateInput(input);

  const existingUser = await userRepository().findOne({
    where: { email: normalized.email },
  });

  if (existingUser) {
    const error = new Error('Email is already in use.');
    error.name = AUTH_ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  const now = new Date();
  const user = userRepository().create({
    email: normalized.email,
    fullName: normalized.fullName,
    firstLoginAt: now,
    lastLoginAt: now,
    leaderId: actorUserId,
  });

  const savedUser = await userRepository().save(user);
  await ensureCollaboratorRole(savedUser.id);

  await userCreationAuditRepository().save(
    userCreationAuditRepository().create({
      createdUserId: savedUser.id,
      creatorLeaderUserId: actorUserId,
    }),
  );

  return {
    id: savedUser.id,
    email: savedUser.email,
    fullName: savedUser.fullName,
    role: normalized.role,
    leaderId: actorUserId,
    createdByUserId: actorUserId,
    createdAt: savedUser.createdAt.toISOString(),
  };
}

function normalizeHierarchySearchQuery(input: HierarchySearchInput): string | null {
  const raw = input.query?.trim();
  if (!raw) {
    return null;
  }

  return raw.toLowerCase();
}

export async function searchOrphanUsers(
  input: HierarchySearchInput = {},
): Promise<HierarchyOrphanUserSummary[]> {
  const normalizedQuery = normalizeHierarchySearchQuery(input);
  const repository = userRepository();
  const qb = repository
    .createQueryBuilder('user')
    .select(['user.id', 'user.fullName', 'user.email'])
    .where('user.leaderId IS NULL')
    .orderBy('user.fullName', 'ASC');

  if (input.excludeUserId) {
    qb.andWhere('user.id != :excludeUserId', { excludeUserId: input.excludeUserId });
  }

  if (normalizedQuery) {
    qb.andWhere('(LOWER(user.fullName) LIKE :query OR LOWER(user.email) LIKE :query)', {
      query: `%${normalizedQuery}%`,
    });
  }

  const users = await qb.getMany();
  return users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
  }));
}

export async function recordHierarchyAssignmentAuditEvent(
  event: HierarchyAssignmentAuditEvent,
): Promise<void> {
  // v1 audit trail is persisted in structured backend logs.
  // A dedicated DB audit table can be added in a follow-up migration if needed.
  console.info('[hierarchy-assignment-audit]', JSON.stringify(event));
}

export async function assignLeaderToOrphanUser(
  actorLeaderUserId: string,
  targetUserId: string,
): Promise<HierarchyAssignResult> {
  const repository = userRepository();
  const targetUser = await repository.findOne({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    const error = new Error('User not found.');
    error.name = AUTH_ERROR_CODES.NOT_FOUND;
    throw error;
  }

  if (targetUser.id === actorLeaderUserId) {
    const error = new Error('You cannot assign yourself as your own leader.');
    error.name = AUTH_ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  if (targetUser.leaderId) {
    const error = new Error('Selected user is no longer eligible for assignment.');
    error.name = AUTH_ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  const previousLeaderId = targetUser.leaderId;
  targetUser.leaderId = actorLeaderUserId;
  const savedUser = await repository.save(targetUser);

  await recordHierarchyAssignmentAuditEvent({
    actorLeaderUserId,
    targetUserId: savedUser.id,
    previousLeaderId,
    newLeaderId: actorLeaderUserId,
    assignedAt: savedUser.updatedAt.toISOString(),
  });

  return {
    userId: savedUser.id,
    leaderId: actorLeaderUserId,
    updatedAt: savedUser.updatedAt.toISOString(),
  };
}

export async function getLeaderHierarchyView(
  actorUserId: string,
): Promise<LeaderHierarchyViewResponse> {
  const actor = await userRepository().findOne({
    where: { id: actorUserId },
    relations: { leader: true },
  });

  if (!actor) {
    const error = new Error('User not found.');
    error.name = AUTH_ERROR_CODES.NOT_FOUND;
    throw error;
  }

  const descendantRows = await userRepository().query<HierarchyDescendantRow[]>(
    `
    WITH RECURSIVE subtree AS (
      SELECT id, full_name, email, leader_id
      FROM users
      WHERE leader_id = $1
      UNION ALL
      SELECT u.id, u.full_name, u.email, u.leader_id
      FROM users u
      INNER JOIN subtree s ON u.leader_id = s.id
    )
    SELECT id, full_name, email, leader_id FROM subtree
    ORDER BY full_name ASC
    `,
    [actorUserId],
  );

  const manager = actor.leader ? toHierarchyViewNode(actor.leader) : null;
  const self = toHierarchyViewNode(actor, true);
  const reports = buildHierarchyTreeFromRows(descendantRows, actorUserId);

  return { manager, self, reports };
}
