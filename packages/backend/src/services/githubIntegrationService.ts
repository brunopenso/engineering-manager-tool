import { AppDataSource } from '../database/connection.js';
import { GithubIntegration } from '../database/entities/GithubIntegration.js';
import {
  GithubIntegrationDuplicateLoginError,
  validateGithubIntegrationOrganizationName,
} from './githubIntegrationValidation.js';

const integrationRepository = () => AppDataSource.getRepository(GithubIntegration);

export type GithubIntegrationDto = {
  id: string;
  organizationName: string;
  createdAt: string;
  updatedAt: string;
};

export function mapGithubIntegration(entity: GithubIntegration): GithubIntegrationDto {
  return {
    id: entity.id,
    organizationName: entity.organizationName,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export async function listGithubIntegrations(): Promise<GithubIntegration[]> {
  return integrationRepository().find({
    order: { organizationName: 'ASC' },
  });
}

export async function enableGithubIntegration(
  organizationNameInput: unknown,
): Promise<GithubIntegration> {
  const organizationName = validateGithubIntegrationOrganizationName(organizationNameInput);

  const existing = await integrationRepository().findOne({ where: { organizationName } });
  if (existing) {
    throw new GithubIntegrationDuplicateLoginError(
      'This GitHub organization is already enabled.',
    );
  }

  const integration = integrationRepository().create({ organizationName });
  return integrationRepository().save(integration);
}

export async function disableGithubIntegration(integrationId: string): Promise<boolean> {
  const integration = await integrationRepository().findOne({ where: { id: integrationId } });
  if (!integration) {
    return false;
  }

  await integrationRepository().remove(integration);
  return true;
}
