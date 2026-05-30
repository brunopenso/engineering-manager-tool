import type { EntityManager } from 'typeorm';
import { USER_ROLE_TYPES, type UserRoleType } from '../../src/auth/types.js';
import { User } from '../../src/database/entities/User.js';
import { UserRole } from '../../src/database/entities/UserRole.js';
import { defineSeed } from '../../src/database/seeds.js';

type SeedUserInput = {
  email: string;
  fullName: string;
  leaderId: string | null;
};

async function upsertUser(manager: EntityManager, input: SeedUserInput): Promise<User> {
  const repo = manager.getRepository(User);
  let user = await repo.findOne({ where: { email: input.email } });
  const now = new Date();

  if (!user) {
    user = repo.create({
      email: input.email,
      fullName: input.fullName,
      leaderId: input.leaderId,
      firstLoginAt: now,
      lastLoginAt: now,
    });
  } else {
    user.fullName = input.fullName;
    user.leaderId = input.leaderId;
  }

  return repo.save(user);
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
  name: 'leadership-hierarchy',
  async run(dataSource) {
    await dataSource.transaction(async (manager) => {
      const vp = await upsertUser(manager, {
        email: 'vp@seed.local',
        fullName: 'Alex Morgan, VP',
        leaderId: null,
      });

      const executiveDirector = await upsertUser(manager, {
        email: 'executive.director@seed.local',
        fullName: 'Blake Chen, Executive Director',
        leaderId: vp.id,
      });

      const director = await upsertUser(manager, {
        email: 'director@seed.local',
        fullName: 'Casey Rivera, Director',
        leaderId: executiveDirector.id,
      });

      const srManagers = await Promise.all([
        upsertUser(manager, {
          email: 'sr.manager.1@seed.local',
          fullName: 'Dana Kim, Sr Manager',
          leaderId: director.id,
        }),
        upsertUser(manager, {
          email: 'sr.manager.2@seed.local',
          fullName: 'Elliot Park, Sr Manager',
          leaderId: director.id,
        }),
        upsertUser(manager, {
          email: 'sr.manager.3@seed.local',
          fullName: 'Finley Shaw, Sr Manager',
          leaderId: director.id,
        }),
      ]);

      const seededUsers = [vp, executiveDirector, director, ...srManagers];

      for (const user of seededUsers) {
        await ensureRole(manager, user.id, USER_ROLE_TYPES.COLLABORATOR);
        await ensureRole(manager, user.id, USER_ROLE_TYPES.LEADER);
      }
    });
  },
});
