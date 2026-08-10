import { AppDataSource } from '../database/connection.js';
import { GithubPrCollectionControl } from '../database/entities/GithubPrCollectionControl.js';
import type { GithubPrCollectionStatus } from '../database/entities/GithubPrCollectionControl.js';

export type CollectionControlKey = {
  collaboratorId: string;
  githubLogin: string;
  organization: string;
  startDate: string;
  endDate: string;
};

const controlRepository = () => AppDataSource.getRepository(GithubPrCollectionControl);

export async function findCollectionControl(
  key: Omit<CollectionControlKey, 'githubLogin'>,
): Promise<GithubPrCollectionControl | null> {
  return controlRepository().findOne({
    where: {
      collaboratorId: key.collaboratorId,
      organization: key.organization,
      startDate: key.startDate,
      endDate: key.endDate,
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
    existing.githubLogin = key.githubLogin;
    existing.status = status;
    existing.executedAt = executedAt;
    existing.errorDetails = errorDetails;
    return controlRepository().save(existing);
  }

  const row = controlRepository().create({
    collaboratorId: key.collaboratorId,
    githubLogin: key.githubLogin,
    organization: key.organization,
    startDate: key.startDate,
    endDate: key.endDate,
    status,
    executedAt,
    errorDetails,
  });
  return controlRepository().save(row);
}

export function shouldSkipSuccessfulCollection(
  control: GithubPrCollectionControl | null,
): boolean {
  return control?.status === 'success';
}
