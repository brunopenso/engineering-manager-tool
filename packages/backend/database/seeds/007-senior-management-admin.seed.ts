import type { EntityManager } from 'typeorm';
import { USER_ROLE_TYPES, type UserRoleType } from '../../src/auth/types.js';
import { User } from '../../src/database/entities/User.js';
import { UserRole } from '../../src/database/entities/UserRole.js';
import { defineSeed } from '../../src/database/seeds.js';

const SENIOR_MANAGEMENT_EMAILS = [
  'vp@seed.local',
  'executive.director@seed.local',
  'director@seed.local',
  'sr.manager.1@seed.local',
  'sr.manager.2@seed.local',
  'sr.manager.3@seed.local',
] as const;

async function findSeedUser(manager: EntityManager, email: string): Promise<User> {
  const user = await manager.getRepository(User).findOne({ where: { email } });

  if (!user) {
    throw new Error(`Seed user ${email} not found. Run 001-leadership-hierarchy seed first.`);
  }

  return user;
}

async function ensureRole(
  manager: EntityManager,
  userId: string,
  role: UserRoleType,
): Promise<void> {
  const repo = manager.getRepository(UserRole);
  const existing = await repo.findOne({ where: { userId, role } });

  if (existing) {
    return;
  }

  await repo.save(repo.create({ userId, role }));
}

export default defineSeed({
  name: 'senior-management-admin',
  async run(dataSource) {
    await dataSource.transaction(async (manager) => {
      for (const email of SENIOR_MANAGEMENT_EMAILS) {
        const user = await findSeedUser(manager, email);
        await ensureRole(manager, user.id, USER_ROLE_TYPES.COLLABORATOR);
        await ensureRole(manager, user.id, USER_ROLE_TYPES.ADMINISTRATOR);
      }
    });
  },
});
