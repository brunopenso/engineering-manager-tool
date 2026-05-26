import { AppDataSource } from '../database/connection.js';
import { User } from '../database/entities/User.js';
import { UserCreationAudit } from '../database/entities/UserCreationAudit.js';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { ensureCollaboratorRole } from './roleService.js';
import {
  normalizeLeaderCreateInput,
  type LeaderCreateUserInput,
} from './userCreateValidation.js';

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
