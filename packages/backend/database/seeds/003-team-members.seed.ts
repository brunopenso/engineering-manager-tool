import type { EntityManager } from 'typeorm';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import { User } from '../../src/database/entities/User.js';
import { UserRole } from '../../src/database/entities/UserRole.js';
import { defineSeed } from '../../src/database/seeds.js';

type TeamConfig = {
  leaderEmail: string;
  size: number;
};

const TEAM_CONFIG: TeamConfig[] = [
  { leaderEmail: 'manager.1.1@seed.local', size: 5 },
  { leaderEmail: 'manager.1.2@seed.local', size: 3 },
  { leaderEmail: 'coordinator.1.1@seed.local', size: 4 },
  { leaderEmail: 'manager.2.1@seed.local', size: 6 },
  { leaderEmail: 'manager.2.2@seed.local', size: 3 },
  { leaderEmail: 'manager.2.3@seed.local', size: 5 },
  { leaderEmail: 'coordinator.3.1@seed.local', size: 4 },
  { leaderEmail: 'coordinator.3.2@seed.local', size: 3 },
  { leaderEmail: 'manager.3.1@seed.local', size: 6 },
  { leaderEmail: 'manager.3.2@seed.local', size: 4 },
];

const FIRST_NAMES = [
  'Avery',
  'Blake',
  'Cameron',
  'Drew',
  'Emery',
  'Finley',
  'Gray',
  'Harper',
  'Indigo',
  'Jules',
  'Kennedy',
  'Logan',
  'Marley',
  'Nico',
  'Oakley',
  'Peyton',
  'Quinn',
  'Reese',
  'Skyler',
  'Tatum',
  'Uma',
  'Vale',
  'Winter',
  'Xander',
  'Yael',
  'Zion',
  'Adrian',
  'Bianca',
  'Caleb',
  'Delia',
  'Elena',
  'Felix',
  'Gina',
  'Hugo',
  'Isla',
  'Jonah',
  'Keira',
  'Leo',
  'Maya',
  'Nolan',
  'Opal',
  'Priya',
  'Remy',
  'Sienna',
  'Theo',
  'Uma',
  'Vera',
  'Wes',
  'Xena',
  'Yara',
  'Zane',
  'Amir',
  'Bella',
  'Cole',
  'Diana',
  'Ethan',
  'Fiona',
  'Gavin',
  'Hannah',
  'Ivan',
  'Jade',
];

const LAST_NAMES = [
  'Adams',
  'Bennett',
  'Clark',
  'Diaz',
  'Edwards',
  'Foster',
  'Garcia',
  'Hayes',
  'Ingram',
  'Jensen',
  'Khan',
  'Lopez',
  'Morales',
  'Nguyen',
  'Owens',
  'Price',
  'Ramirez',
  'Singh',
  'Torres',
  'Underwood',
  'Vasquez',
  'Walsh',
  'Xu',
  'Young',
  'Zimmerman',
  'Baker',
  'Cooper',
  'Dunn',
  'Evans',
  'Flores',
  'Grant',
  'Hughes',
];

const MEMBER_ROLES = ['Engineer', 'Analyst', 'Specialist', 'Developer', 'Associate'];

function memberProfile(globalIndex: number): { fullName: string } {
  const firstName = FIRST_NAMES[globalIndex % FIRST_NAMES.length]!;
  const lastName = LAST_NAMES[Math.floor(globalIndex / FIRST_NAMES.length) % LAST_NAMES.length]!;
  const role = MEMBER_ROLES[globalIndex % MEMBER_ROLES.length]!;

  return { fullName: `${firstName} ${lastName}, ${role}` };
}

function memberEmail(leaderEmail: string, memberIndex: number): string {
  const localPart = leaderEmail.replace('@seed.local', '');
  return `${localPart}.member.${memberIndex}@seed.local`;
}

async function findSeedUser(manager: EntityManager, email: string): Promise<User> {
  const user = await manager.getRepository(User).findOne({ where: { email } });

  if (!user) {
    throw new Error(`Seed user ${email} not found. Run 002-sr-manager-reports seed first.`);
  }

  return user;
}

async function upsertTeamMember(
  manager: EntityManager,
  leaderId: string,
  email: string,
  fullName: string,
): Promise<User> {
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

  return savedUser;
}

export default defineSeed({
  name: 'team-members',
  async run(dataSource) {
    await dataSource.transaction(async (manager) => {
      let globalIndex = 0;

      for (const team of TEAM_CONFIG) {
        const leader = await findSeedUser(manager, team.leaderEmail);

        for (let memberIndex = 1; memberIndex <= team.size; memberIndex += 1) {
          const profile = memberProfile(globalIndex);
          globalIndex += 1;

          await upsertTeamMember(
            manager,
            leader.id,
            memberEmail(team.leaderEmail, memberIndex),
            profile.fullName,
          );
        }
      }
    });
  },
});
