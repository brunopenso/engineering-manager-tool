import type { EntityManager } from 'typeorm';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import type { BusinessImpact } from '../../src/database/entities/Deliverable.js';
import { Deliverable } from '../../src/database/entities/Deliverable.js';
import { DeliverableSystemTag } from '../../src/database/entities/DeliverableSystemTag.js';
import { Tag } from '../../src/database/entities/Tag.js';
import { User } from '../../src/database/entities/User.js';
import { UserRole } from '../../src/database/entities/UserRole.js';
import { defineSeed } from '../../src/database/seeds.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LEADER_PERIOD_DAYS = 4 * 30;
const COLLABORATOR_PERIOD_DAYS = 6 * 30;

const BUSINESS_IMPACTS: BusinessImpact[] = ['LOW', 'MEDIUM', 'HIGH', 'TRANSFORMATIONAL'];

const DELIVERABLE_TOPICS = [
  'API reliability improvements',
  'Customer onboarding flow',
  'Data pipeline optimization',
  'Internal tooling upgrade',
  'Mobile experience refresh',
  'Performance monitoring rollout',
  'Security hardening initiative',
  'Team workflow automation',
  'Documentation and runbooks',
  'Cross-team integration work',
  'Quality assurance automation',
  'Infrastructure cost reduction',
];

const ROLES_IN_DELIVERABLE = [
  'Technical lead',
  'Primary contributor',
  'Supporting engineer',
  'Project coordinator',
  'Implementation owner',
];

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function stableCount(seed: string, min: number, max: number): number {
  const span = max - min + 1;
  return min + (hashString(seed) % span);
}

function emailLocalPart(email: string): string {
  return email.replace('@seed.local', '').replace(/\./g, '-');
}

function seedTitle(email: string, index: number): string {
  return `[Seed] ${emailLocalPart(email)} #${index}`;
}

function dateInPeriod(endMs: number, periodDays: number, index: number, total: number): Date {
  const startMs = endMs - periodDays * MS_PER_DAY;
  const slot = total <= 1 ? 0.5 : index / (total - 1);
  return new Date(startMs + slot * (endMs - startMs));
}

function pickTopic(email: string, index: number): string {
  const topicIndex = hashString(`${email}:${index}:topic`) % DELIVERABLE_TOPICS.length;
  return DELIVERABLE_TOPICS[topicIndex]!;
}

function pickBusinessImpact(email: string, index: number): BusinessImpact {
  const impactIndex = hashString(`${email}:${index}:impact`) % BUSINESS_IMPACTS.length;
  return BUSINESS_IMPACTS[impactIndex]!;
}

function pickRoleInDeliverable(email: string, index: number): string {
  const roleIndex = hashString(`${email}:${index}:role`) % ROLES_IN_DELIVERABLE.length;
  return ROLES_IN_DELIVERABLE[roleIndex]!;
}

function pickSystemTagIds(tags: Tag[], email: string, index: number): string[] {
  if (tags.length === 0) {
    return [];
  }

  const primaryIndex = hashString(`${email}:${index}:tag`) % tags.length;
  const primary = tags[primaryIndex]!;

  if (tags.length === 1 || hashString(`${email}:${index}:tag2`) % 3 === 0) {
    return [primary.id];
  }

  let secondaryIndex = hashString(`${email}:${index}:tag-secondary`) % tags.length;
  if (secondaryIndex === primaryIndex) {
    secondaryIndex = (secondaryIndex + 1) % tags.length;
  }

  return [primary.id, tags[secondaryIndex]!.id];
}

async function loadLeaderUserIds(manager: EntityManager): Promise<Set<string>> {
  const rows = await manager.getRepository(UserRole).find({
    where: { role: USER_ROLE_TYPES.LEADER },
    select: { userId: true },
  });

  return new Set(rows.map((row) => row.userId));
}

async function loadSystemTags(manager: EntityManager): Promise<Tag[]> {
  const tags = await manager.getRepository(Tag).find({ order: { name: 'ASC' } });

  if (tags.length === 0) {
    throw new Error('No system tags found. Run 005-system-tags seed first.');
  }

  return tags;
}

async function upsertSeedDeliverable(
  manager: EntityManager,
  user: User,
  index: number,
  total: number,
  isLeader: boolean,
  tags: Tag[],
  endMs: number,
): Promise<void> {
  const title = seedTitle(user.email, index);
  const topic = pickTopic(user.email, index);
  const timestamp = dateInPeriod(
    endMs,
    isLeader ? LEADER_PERIOD_DAYS : COLLABORATOR_PERIOD_DAYS,
    index - 1,
    total,
  );
  const deliverableRepo = manager.getRepository(Deliverable);
  let deliverable = await deliverableRepo.findOne({
    where: { userId: user.id, title },
  });

  const payload = {
    userId: user.id,
    title,
    description: `Seed deliverable covering ${topic.toLowerCase()} for ${user.fullName}.`,
    roleInDeliverable: pickRoleInDeliverable(user.email, index),
    businessImpact: pickBusinessImpact(user.email, index),
    improvementPoints: `Continue improving outcomes related to ${topic.toLowerCase()}.`,
    technicalDescription: `Technical notes for ${topic.toLowerCase()}.`,
    updatedAt: timestamp,
  };

  if (!deliverable) {
    deliverable = deliverableRepo.create({
      ...payload,
      createdAt: timestamp,
    });
  } else {
    Object.assign(deliverable, payload);
  }

  const saved = await deliverableRepo.save(deliverable);
  const systemTagIds = pickSystemTagIds(tags, user.email, index);

  await manager.delete(DeliverableSystemTag, { deliverableId: saved.id });

  for (const tagId of systemTagIds) {
    await manager.save(
      manager.create(DeliverableSystemTag, {
        deliverableId: saved.id,
        tagId,
      }),
    );
  }
}

export default defineSeed({
  name: 'deliverables',
  async run(dataSource) {
    await dataSource.transaction(async (manager) => {
      const users = await manager.getRepository(User).find({ order: { email: 'ASC' } });

      if (users.length === 0) {
        throw new Error('No users found. Run user hierarchy seeds first.');
      }

      const leaderUserIds = await loadLeaderUserIds(manager);
      const tags = await loadSystemTags(manager);
      const endMs = Date.now();

      for (const user of users) {
        const isLeader = leaderUserIds.has(user.id);
        const total = isLeader ? stableCount(user.email, 2, 4) : stableCount(user.email, 6, 10);

        for (let index = 1; index <= total; index += 1) {
          await upsertSeedDeliverable(manager, user, index, total, isLeader, tags, endMs);
        }
      }
    });
  },
});
