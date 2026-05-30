import type { EntityManager } from 'typeorm';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import { User } from '../../src/database/entities/User.js';
import { UserRole } from '../../src/database/entities/UserRole.js';
import { defineSeed } from '../../src/database/seeds.js';

const SR_MANAGER_EMAIL = 'sr.manager.1@seed.local';

const COLLABORATORS = [
  { email: 'sr.manager.1.collaborator.1@seed.local', fullName: 'Riley Chen, Collaborator' },
  { email: 'sr.manager.1.collaborator.2@seed.local', fullName: 'Sam Rivera, Collaborator' },
  { email: 'sr.manager.1.collaborator.3@seed.local', fullName: 'Tessa Brooks, Collaborator' },
  { email: 'sr.manager.1.collaborator.4@seed.local', fullName: 'Uri Ortiz, Collaborator' },
] as const;

async function findSeedUser(manager: EntityManager, email: string): Promise<User> {
  const user = await manager.getRepository(User).findOne({ where: { email } });

  if (!user) {
    throw new Error(
      `Seed user ${email} not found. Run 001-leadership-hierarchy seed first.`,
    );
  }

  return user;
}

async function upsertCollaborator(
  manager: EntityManager,
  leaderId: string,
  email: string,
  fullName: string,
): Promise<void> {
  const repo = manager.getRepository(User);
  let user = await repo.findOne({ where: { email } });
  const now = new Date();

  if (!user) {
    user = repo.create({
      email,
      fullName,
      leaderId,
      firstLoginAt: now,
      lastLoginAt: now,
    });
  } else {
    user.fullName = fullName;
    user.leaderId = leaderId;
  }

  const savedUser = await repo.save(user);

  const roleRepo = manager.getRepository(UserRole);
  const existingRole = await roleRepo.findOne({
    where: { userId: savedUser.id, role: USER_ROLE_TYPES.COLLABORATOR },
  });

  if (!existingRole) {
    await roleRepo.save(
      roleRepo.create({ userId: savedUser.id, role: USER_ROLE_TYPES.COLLABORATOR }),
    );
  }
}

export default defineSeed({
  name: 'sr-manager-1-collaborators',
  async run(dataSource) {
    await dataSource.transaction(async (manager) => {
      const srManager = await findSeedUser(manager, SR_MANAGER_EMAIL);

      for (const collaborator of COLLABORATORS) {
        await upsertCollaborator(
          manager,
          srManager.id,
          collaborator.email,
          collaborator.fullName,
        );
      }
    });
  },
});
