import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataSource } from '../../src/database/connection.js';
import { DeliverableReview } from '../../src/database/entities/DeliverableReview.js';
import {
  saveReviewNotes,
  setDeliverableReviewed,
} from '../../src/services/deliverableReviewService.js';

describe('deliverable review notes reviewed toggle compatibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves notes when reviewed is toggled off', async () => {
    const existing = {
      id: 'review-1',
      deliverableId: 'del-1',
      reviewerUserId: 'leader-1',
      reviewed: true,
      notes: 'Keep these notes',
      updatedAt: new Date(),
    } as DeliverableReview;

    const save = vi.fn(async (entity: DeliverableReview) => entity);
    const remove = vi.fn();

    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      findOne: vi.fn(async () => existing),
      save,
      remove,
      create: vi.fn(),
    } as never);

    const result = await setDeliverableReviewed('del-1', 'leader-1', false);

    expect(result).toEqual({ deliverableId: 'del-1', reviewed: false });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'Keep these notes', reviewed: false }),
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it('auto-marks reviewed when saving non-empty notes', async () => {
    const created = {
      id: 'review-2',
      deliverableId: 'del-2',
      reviewerUserId: 'leader-1',
      reviewed: true,
      notes: 'New note',
      updatedAt: new Date('2026-05-30T12:00:00.000Z'),
    } as DeliverableReview;

    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      findOne: vi.fn(async () => null),
      save: vi.fn(async (entity: DeliverableReview) => entity),
      create: vi.fn((entity: Partial<DeliverableReview>) => ({ ...created, ...entity })),
      remove: vi.fn(),
    } as never);

    const result = await saveReviewNotes('del-2', 'leader-1', 'New note');

    expect(result).toMatchObject({
      deliverableId: 'del-2',
      notes: 'New note',
      reviewed: true,
    });
  });
});
