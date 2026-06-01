import { Between, In, type FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../database/connection.js';
import { Deliverable } from '../database/entities/Deliverable.js';
import { DeliverableLink } from '../database/entities/DeliverableLink.js';
import { DeliverableReview } from '../database/entities/DeliverableReview.js';
import { DeliverableSystemTag } from '../database/entities/DeliverableSystemTag.js';
import { DeliverableUserTag } from '../database/entities/DeliverableUserTag.js';
import { Tag } from '../database/entities/Tag.js';
import type { DeliverableListFilters } from '../types/deliverableListFilters.js';
import type { TeamDeliverableRow } from '../types/teamDeliverables.js';
import { resolveCreatedAtBounds } from './deliverableListQuery.js';
import { validateDateRange } from './teamDeliverablesDate.js';
import {
  DeliverableValidationError,
  InvalidSystemTagError,
  validateDeliverableWriteInput,
  type DeliverableWriteInput,
} from './deliverableValidation.js';

export type TagSummaryDto = {
  id: string;
  name: string;
  color: string;
};

export type DeliverableSummaryDto = {
  id: string;
  ownerUserId: string;
  title: string;
  businessImpact: string;
  systemTags: TagSummaryDto[];
  createdAt: string;
  updatedAt: string;
};

export type DeliverableDetailDto = DeliverableSummaryDto & {
  description: string;
  roleInDeliverable: string;
  improvementPoints: string;
  technicalDescription: string | null;
  userTags: string[];
  links: { url: string; label: string | null }[];
  createdAt: string;
};

const deliverableRepository = () => AppDataSource.getRepository(Deliverable);

const DELIVERABLE_RELATIONS = {
  systemTags: { tag: true },
  userTags: true,
  links: true,
} as const;

function mapTagSummary(tag: Tag): TagSummaryDto {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  };
}

function mapDeliverableSummary(deliverable: Deliverable): DeliverableSummaryDto {
  return {
    id: deliverable.id,
    ownerUserId: deliverable.userId,
    title: deliverable.title,
    businessImpact: deliverable.businessImpact,
    systemTags: (deliverable.systemTags ?? [])
      .map((row) => row.tag)
      .filter((tag): tag is Tag => Boolean(tag))
      .map(mapTagSummary),
    createdAt: deliverable.createdAt.toISOString(),
    updatedAt: deliverable.updatedAt.toISOString(),
  };
}

export function mapDeliverableDetail(deliverable: Deliverable): DeliverableDetailDto {
  return {
    ...mapDeliverableSummary(deliverable),
    description: deliverable.description,
    roleInDeliverable: deliverable.roleInDeliverable,
    improvementPoints: deliverable.improvementPoints,
    technicalDescription: deliverable.technicalDescription,
    userTags: (deliverable.userTags ?? []).map((row) => row.label),
    links: (deliverable.links ?? []).map((row) => ({
      url: row.url,
      label: row.label,
    })),
    createdAt: deliverable.createdAt.toISOString(),
  };
}

async function assertSystemTagsExist(tagIds: string[]): Promise<void> {
  const tagRepository = AppDataSource.getRepository(Tag);
  const found = await tagRepository.find({ where: { id: In(tagIds) } });
  if (found.length !== tagIds.length) {
    throw new InvalidSystemTagError('One or more system tags are invalid or no longer available.');
  }
}

async function replaceChildRows(
  manager: typeof AppDataSource.manager,
  deliverableId: string,
  validated: ReturnType<typeof validateDeliverableWriteInput>,
): Promise<void> {
  await manager.delete(DeliverableSystemTag, { deliverableId });
  await manager.delete(DeliverableUserTag, { deliverableId });
  await manager.delete(DeliverableLink, { deliverableId });

  await manager.save(
    validated.systemTagIds.map((tagId) =>
      manager.create(DeliverableSystemTag, { deliverableId, tagId }),
    ),
  );

  if (validated.userTags.length > 0) {
    await manager.save(
      validated.userTags.map((label) =>
        manager.create(DeliverableUserTag, { deliverableId, label }),
      ),
    );
  }

  if (validated.links.length > 0) {
    await manager.save(
      validated.links.map((link) =>
        manager.create(DeliverableLink, {
          deliverableId,
          url: link.url,
          label: link.label,
        }),
      ),
    );
  }
}

export async function countDeliverablesForOwner(ownerUserId: string): Promise<number> {
  return deliverableRepository().count({ where: { userId: ownerUserId } });
}

export async function listDeliverablesForOwner(
  ownerUserId: string,
  filters?: DeliverableListFilters,
): Promise<DeliverableSummaryDto[]> {
  if (!filters) {
    const rows = await deliverableRepository().find({
      where: { userId: ownerUserId },
      relations: DELIVERABLE_RELATIONS,
      order: { updatedAt: 'DESC' },
    });

    return rows.map(mapDeliverableSummary);
  }

  if (filters.systemTagIds?.length) {
    await assertSystemTagsExist(filters.systemTagIds);
  }

  const { start, end } = resolveCreatedAtBounds(filters);

  if (filters.systemTagIds?.length) {
    const qb = deliverableRepository()
      .createQueryBuilder('deliverable')
      .leftJoinAndSelect('deliverable.systemTags', 'systemTagRow')
      .leftJoinAndSelect('systemTagRow.tag', 'tag')
      .where('deliverable.userId = :ownerUserId', { ownerUserId })
      .andWhere('deliverable.createdAt BETWEEN :start AND :end', { start, end })
      .innerJoin(
        'deliverable.systemTags',
        'filterTag',
        'filterTag.tagId IN (:...systemTagIds)',
        { systemTagIds: filters.systemTagIds },
      )
      .distinct(true)
      .orderBy('deliverable.updatedAt', 'DESC');

    if (filters.businessImpacts?.length) {
      qb.andWhere('deliverable.businessImpact IN (:...businessImpacts)', {
        businessImpacts: filters.businessImpacts,
      });
    }

    const rows = await qb.getMany();
    return rows.map(mapDeliverableSummary);
  }

  const where: FindOptionsWhere<Deliverable> = {
    userId: ownerUserId,
    createdAt: Between(start, end),
  };

  if (filters.businessImpacts?.length) {
    where.businessImpact = In(filters.businessImpacts);
  }

  const rows = await deliverableRepository().find({
    where,
    relations: DELIVERABLE_RELATIONS,
    order: { updatedAt: 'DESC' },
  });

  return rows.map(mapDeliverableSummary);
}

export async function listTeamDeliverablesForReview(
  ownerUserId: string,
  reviewerUserId: string,
  startDate: string,
  endDate: string,
): Promise<TeamDeliverableRow[]> {
  const { start, end } = validateDateRange(startDate, endDate);

  const rows = await deliverableRepository().find({
    where: {
      userId: ownerUserId,
      updatedAt: Between(start, end),
    },
    relations: { systemTags: { tag: true } },
    order: { updatedAt: 'DESC' },
  });

  if (rows.length === 0) {
    return [];
  }

  const deliverableIds = rows.map((row) => row.id);
  const reviewRepository = AppDataSource.getRepository(DeliverableReview);
  const reviews = await reviewRepository.find({
    where: {
      reviewerUserId,
      deliverableId: In(deliverableIds),
      reviewed: true,
    },
  });

  const reviewedIds = new Set(reviews.map((review) => review.deliverableId));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    reviewed: reviewedIds.has(row.id),
    systemTags: (row.systemTags ?? [])
      .map((systemTag) => systemTag.tag)
      .filter((tag): tag is Tag => Boolean(tag))
      .map(mapTagSummary),
  }));
}

export async function getDeliverableById(deliverableId: string): Promise<Deliverable | null> {
  return deliverableRepository().findOne({
    where: { id: deliverableId },
    relations: DELIVERABLE_RELATIONS,
  });
}

export async function createDeliverable(
  ownerUserId: string,
  input: DeliverableWriteInput,
): Promise<DeliverableDetailDto> {
  const validated = validateDeliverableWriteInput(input);
  await assertSystemTagsExist(validated.systemTagIds);

  const deliverableId = await AppDataSource.transaction(async (manager) => {
    const deliverable = manager.create(Deliverable, {
      userId: ownerUserId,
      title: validated.title,
      description: validated.description,
      roleInDeliverable: validated.roleInDeliverable,
      businessImpact: validated.businessImpact,
      improvementPoints: validated.improvementPoints,
      technicalDescription: validated.technicalDescription,
    });

    const saved = await manager.save(deliverable);
    await replaceChildRows(manager, saved.id, validated);
    return saved.id;
  });

  const loaded = await getDeliverableById(deliverableId);
  if (!loaded) {
    throw new DeliverableValidationError('Failed to load created deliverable.');
  }

  return mapDeliverableDetail(loaded);
}

export async function updateDeliverable(
  deliverableId: string,
  input: DeliverableWriteInput,
): Promise<DeliverableDetailDto | null> {
  const current = await deliverableRepository().findOne({ where: { id: deliverableId } });
  if (!current) {
    return null;
  }

  const validated = validateDeliverableWriteInput(input);
  await assertSystemTagsExist(validated.systemTagIds);

  await AppDataSource.transaction(async (manager) => {
    current.title = validated.title;
    current.description = validated.description;
    current.roleInDeliverable = validated.roleInDeliverable;
    current.businessImpact = validated.businessImpact;
    current.improvementPoints = validated.improvementPoints;
    current.technicalDescription = validated.technicalDescription;

    await manager.save(current);
    await replaceChildRows(manager, deliverableId, validated);
  });

  const loaded = await getDeliverableById(deliverableId);
  return loaded ? mapDeliverableDetail(loaded) : null;
}

export async function deleteDeliverable(deliverableId: string): Promise<boolean> {
  const current = await deliverableRepository().findOne({ where: { id: deliverableId } });
  if (!current) {
    return false;
  }

  await deliverableRepository().remove(current);
  return true;
}
