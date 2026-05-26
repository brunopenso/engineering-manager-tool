import { AppDataSource } from '../database/connection.js';
import { Tag } from '../database/entities/Tag.js';
import { TagDuplicateNameError, TagValidationError, validateTagColor, validateTagName } from './tagValidation.js';

type CreateTagInput = {
  name: string;
  color: string;
};

type UpdateTagInput = {
  name?: string;
  color?: string;
};

const tagRepository = () => AppDataSource.getRepository(Tag);

export async function listTags(): Promise<Tag[]> {
  return tagRepository().find({
    order: { name: 'ASC' },
  });
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const normalizedName = validateTagName(input.name);
  const normalizedColor = validateTagColor(input.color);

  const existing = await tagRepository()
    .createQueryBuilder('tag')
    .where('LOWER(tag.name) = LOWER(:name)', { name: normalizedName })
    .getOne();

  if (existing) {
    throw new TagDuplicateNameError('A tag with this name already exists.');
  }

  const tag = tagRepository().create({
    name: normalizedName,
    color: normalizedColor,
  });

  return tagRepository().save(tag);
}

export async function updateTag(tagId: string, input: UpdateTagInput): Promise<Tag | null> {
  const current = await tagRepository().findOne({ where: { id: tagId } });
  if (!current) {
    return null;
  }

  if (!input.name && !input.color) {
    throw new TagValidationError('At least one field must be provided to update.');
  }

  if (input.name !== undefined) {
    const normalizedName = validateTagName(input.name);
    const duplicate = await tagRepository()
      .createQueryBuilder('tag')
      .where('LOWER(tag.name) = LOWER(:name)', { name: normalizedName })
      .andWhere('tag.id != :id', { id: tagId })
      .getOne();

    if (duplicate) {
      throw new TagDuplicateNameError('A tag with this name already exists.');
    }

    current.name = normalizedName;
  }

  if (input.color !== undefined) {
    current.color = validateTagColor(input.color);
  }

  return tagRepository().save(current);
}

export async function deleteTag(tagId: string): Promise<boolean> {
  const tag = await tagRepository().findOne({ where: { id: tagId } });
  if (!tag) {
    return false;
  }

  await tagRepository().remove(tag);
  return true;
}
