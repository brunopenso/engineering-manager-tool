import type { EntityManager } from 'typeorm';
import { USER_ROLE_TYPES, type UserRoleType } from '../../src/auth/types.js';
import { User } from '../../src/database/entities/User.js';
import { UserRole } from '../../src/database/entities/UserRole.js';
import { defineSeed } from '../../src/database/seeds.js';

type SeedUserInput = {
  email: string;
  fullName: string;
  leaderId: string;
};

async function findSeedUser(manager: EntityManager, email: string): Promise<User> {
  const user = await manager.getRepository(User).findOne({ where: { email } });

  if (!user) {
    throw new Error(`Seed user ${email} not found. Run 001-leadership-hierarchy seed first.`);
  }

  return user;
}

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

async function seedReport(
  manager: EntityManager,
  input: SeedUserInput,
  isLeader: boolean,
): Promise<User> {
  const user = await upsertUser(manager, input);
  await ensureRole(manager, user.id, USER_ROLE_TYPES.COLLABORATOR);

  if (isLeader) {
    await ensureRole(manager, user.id, USER_ROLE_TYPES.LEADER);
  }

  return user;
}

export default defineSeed({
  name: 'sr-manager-reports',
  async run(dataSource) {
    await dataSource.transaction(async (manager) => {
      const srManager1 = await findSeedUser(manager, 'sr.manager.1@seed.local');
      const srManager2 = await findSeedUser(manager, 'sr.manager.2@seed.local');
      const srManager3 = await findSeedUser(manager, 'sr.manager.3@seed.local');

      await seedReport(
        manager,
        {
          email: 'manager.1.1@seed.local',
          fullName: 'Grace Holt, Manager',
          leaderId: srManager1.id,
        },
        true,
      );
      await seedReport(
        manager,
        {
          email: 'manager.1.2@seed.local',
          fullName: 'Henry Webb, Manager',
          leaderId: srManager1.id,
        },
        true,
      );
      await seedReport(
        manager,
        {
          email: 'coordinator.1.1@seed.local',
          fullName: 'Ivy Nguyen, Coordinator',
          leaderId: srManager1.id,
        },
        false,
      );

      await seedReport(
        manager,
        {
          email: 'manager.2.1@seed.local',
          fullName: 'Jordan Lee, Manager',
          leaderId: srManager2.id,
        },
        true,
      );
      await seedReport(
        manager,
        {
          email: 'manager.2.2@seed.local',
          fullName: 'Kai Brooks, Manager',
          leaderId: srManager2.id,
        },
        true,
      );
      await seedReport(
        manager,
        {
          email: 'manager.2.3@seed.local',
          fullName: 'Luna Ortiz, Manager',
          leaderId: srManager2.id,
        },
        true,
      );

      await seedReport(
        manager,
        {
          email: 'coordinator.3.1@seed.local',
          fullName: 'Morgan Ellis, Coordinator',
          leaderId: srManager3.id,
        },
        false,
      );
      await seedReport(
        manager,
        {
          email: 'coordinator.3.2@seed.local',
          fullName: 'Noah Patel, Coordinator',
          leaderId: srManager3.id,
        },
        false,
      );
      await seedReport(
        manager,
        {
          email: 'manager.3.1@seed.local',
          fullName: 'Olivia Reed, Manager',
          leaderId: srManager3.id,
        },
        true,
      );
      await seedReport(
        manager,
        {
          email: 'manager.3.2@seed.local',
          fullName: 'Parker Quinn, Manager',
          leaderId: srManager3.id,
        },
        true,
      );
    });
  },
});
