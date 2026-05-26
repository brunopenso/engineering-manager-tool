import { AppDataSource } from '../database/connection.js';
import { User } from '../database/entities/User.js';
import { ensureCollaboratorRole } from './roleService.js';

type GoogleIdentity = {
  email: string;
  fullName: string;
};

const userRepository = () => AppDataSource.getRepository(User);

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
