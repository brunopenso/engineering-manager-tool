import { AppDataSource } from '../database/connection.js';
import { GithubIntegration } from '../database/entities/GithubIntegration.js';
import {
  GithubIntegrationDuplicateLoginError,
  validateGithubIntegrationLogin,
} from './githubIntegrationValidation.js';

const integrationRepository = () => AppDataSource.getRepository(GithubIntegration);

export type GithubIntegrationDto = {
  id: string;
  login: string;
  createdAt: string;
  updatedAt: string;
};

export function mapGithubIntegration(entity: GithubIntegration): GithubIntegrationDto {
  return {
    id: entity.id,
    login: entity.login,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export async function listGithubIntegrations(): Promise<GithubIntegration[]> {
  return integrationRepository().find({
    order: { login: 'ASC' },
  });
}

export async function enableGithubIntegration(loginInput: unknown): Promise<GithubIntegration> {
  const login = validateGithubIntegrationLogin(loginInput);

  const existing = await integrationRepository().findOne({ where: { login } });
  if (existing) {
    throw new GithubIntegrationDuplicateLoginError(
      'This GitHub organization is already enabled.',
    );
  }

  const integration = integrationRepository().create({ login });
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
