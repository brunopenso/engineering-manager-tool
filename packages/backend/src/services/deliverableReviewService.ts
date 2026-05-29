import { AppDataSource } from '../database/connection.js';
import { DeliverableReview } from '../database/entities/DeliverableReview.js';

const deliverableReviewRepository = () => AppDataSource.getRepository(DeliverableReview);

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
    await repository.remove(existing);
  }

  return { deliverableId, reviewed };
}
