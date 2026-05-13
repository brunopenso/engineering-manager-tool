import { AppDataSource } from '../database/connection.js';
import { User } from '../database/entities/User.js';

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
    return userRepository().save(existingUser);
  }

  const createdUser = userRepository().create({
    email: normalizedEmail,
    fullName: identity.fullName,
    firstLoginAt: now,
    lastLoginAt: now,
  });

  return userRepository().save(createdUser);
}

export async function findUserById(id: string): Promise<User | null> {
  return userRepository().findOne({ where: { id } });
}
