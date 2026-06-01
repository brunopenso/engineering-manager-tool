import { AppDataSource } from '../database/connection.js';
import { DeliverableReview } from '../database/entities/DeliverableReview.js';
import type { DeliverableReviewNotesResponse } from '../types/deliverableReviewNotes.js';

export const MAX_REVIEW_NOTES_LENGTH = 8000;

const deliverableReviewRepository = () => AppDataSource.getRepository(DeliverableReview);

export class ReviewNotesValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VALIDATION_ERROR';
  }
}

function mapReviewNotesResponse(
  deliverableId: string,
  review: DeliverableReview | null,
): DeliverableReviewNotesResponse {
  if (!review) {
    return {
      deliverableId,
      notes: null,
      reviewed: false,
      updatedAt: null,
    };
  }

  return {
    deliverableId,
    notes: review.notes ?? null,
    reviewed: review.reviewed,
    updatedAt: review.updatedAt.toISOString(),
  };
}

/** Scoped to (deliverableId, reviewerUserId) — never returns another leader's notes. */
export async function getReviewNotes(
  deliverableId: string,
  reviewerUserId: string,
): Promise<DeliverableReviewNotesResponse> {
  const repository = deliverableReviewRepository();
  const existing = await repository.findOne({
    where: { deliverableId, reviewerUserId },
  });

  return mapReviewNotesResponse(deliverableId, existing);
}

export async function saveReviewNotes(
  deliverableId: string,
  reviewerUserId: string,
  rawNotes: string,
): Promise<DeliverableReviewNotesResponse> {
  const trimmed = rawNotes.trim();

  if (trimmed.length > MAX_REVIEW_NOTES_LENGTH) {
    throw new ReviewNotesValidationError(
      `Review notes must be at most ${MAX_REVIEW_NOTES_LENGTH} characters.`,
    );
  }

  const repository = deliverableReviewRepository();
  const existing = await repository.findOne({
    where: { deliverableId, reviewerUserId },
  });

  const notesValue = trimmed.length > 0 ? trimmed : null;

  if (existing) {
    existing.notes = notesValue;
    if (trimmed.length > 0) {
      existing.reviewed = true;
    }
    const saved = await repository.save(existing);
    return mapReviewNotesResponse(deliverableId, saved);
  }

  const created = await repository.save(
    repository.create({
      deliverableId,
      reviewerUserId,
      notes: notesValue,
      reviewed: trimmed.length > 0,
    }),
  );

  return mapReviewNotesResponse(deliverableId, created);
}

export async function setDeliverableReviewed(
  deliverableId: string,
  reviewerUserId: string,
  reviewed: boolean,
): Promise<{ deliverableId: string; reviewed: boolean }> {
  const repository = deliverableReviewRepository();
  const existing = await repository.findOne({
    where: { deliverableId, reviewerUserId },
  });

  if (reviewed) {
    if (existing) {
      existing.reviewed = true;
      await repository.save(existing);
    } else {
      await repository.save(
        repository.create({
          deliverableId,
          reviewerUserId,
          reviewed: true,
        }),
      );
    }
  } else if (existing) {
    const hasNotes = Boolean(existing.notes?.trim());

    if (hasNotes) {
      existing.reviewed = false;
      await repository.save(existing);
    } else {
      await repository.remove(existing);
    }
  }

  return { deliverableId, reviewed };
}
