import type { EntityManager } from 'typeorm';
import { Tag } from '../../src/database/entities/Tag.js';
import { defineSeed } from '../../src/database/seeds.js';
import { validateTagColor, validateTagName } from '../../src/services/tagValidation.js';

const SYSTEM_TAGS = [
  { name: 'Year Goal', color: '#1976D2' },
  { name: 'Personal Goal', color: '#9C27B0' },
  { name: 'Action Budge', color: '#FF9800' },
  { name: 'PDI', color: '#607D8B' },
] as const;

async function upsertTag(manager: EntityManager, name: string, color: string): Promise<Tag> {
  const normalizedName = validateTagName(name);
  const normalizedColor = validateTagColor(color);
  const repo = manager.getRepository(Tag);

  let tag = await repo
    .createQueryBuilder('tag')
    .where('LOWER(tag.name) = LOWER(:name)', { name: normalizedName })
    .getOne();

  if (!tag) {
    tag = repo.create({ name: normalizedName, color: normalizedColor });
  } else {
    tag.name = normalizedName;
    tag.color = normalizedColor;
  }

  return repo.save(tag);
}

export default defineSeed({
  name: 'system-tags',
  async run(dataSource) {
    await dataSource.transaction(async (manager) => {
      for (const tag of SYSTEM_TAGS) {
        await upsertTag(manager, tag.name, tag.color);
      }
    });
  },
});
