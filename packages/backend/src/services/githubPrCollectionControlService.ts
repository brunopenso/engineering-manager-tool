import { AppDataSource } from '../database/connection.js';
import { GithubPrCollectionControl } from '../database/entities/GithubPrCollectionControl.js';
import type { GithubPrCollectionStatus } from '../database/entities/GithubPrCollectionControl.js';

export type CollectionControlKey = {
  repositoryId: string;
  githubPullRequestId: string;
};

const controlRepository = () => AppDataSource.getRepository(GithubPrCollectionControl);

export async function findCollectionControl(
  key: CollectionControlKey,
): Promise<GithubPrCollectionControl | null> {
  return controlRepository().findOne({
    where: {
      repositoryId: key.repositoryId,
      githubPullRequestId: key.githubPullRequestId,
    },
  });
}

export async function upsertCollectionControl(
  key: CollectionControlKey,
  status: GithubPrCollectionStatus,
  errorDetails: string | null = null,
  executedAt: Date = new Date(),
): Promise<GithubPrCollectionControl> {
  const existing = await findCollectionControl(key);
  if (existing) {
    existing.status = status;
    existing.executedAt = executedAt;
    existing.errorDetails = errorDetails;
    return controlRepository().save(existing);
  }

  const row = controlRepository().create({
    repositoryId: key.repositoryId,
    githubPullRequestId: key.githubPullRequestId,
    status,
    executedAt,
    errorDetails,
  });
  return controlRepository().save(row);
}
