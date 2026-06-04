import { AUTH_ERROR_CODES } from '../auth/types.js';

const GITHUB_ORGANIZATION_NAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const GITHUB_ORGANIZATION_NAME_MAX_LENGTH = 39;

export class GithubIntegrationValidationError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'GithubIntegrationValidationError';
    this.code = AUTH_ERROR_CODES.VALIDATION_ERROR;
  }
}

export class GithubIntegrationDuplicateLoginError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'GithubIntegrationDuplicateLoginError';
    this.code = AUTH_ERROR_CODES.DUPLICATE_GITHUB_INTEGRATION_LOGIN;
  }
}

export function validateGithubIntegrationOrganizationName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new GithubIntegrationValidationError('Organization name must be a string.');
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new GithubIntegrationValidationError('Organization name is required.');
  }

  if (trimmed.length > GITHUB_ORGANIZATION_NAME_MAX_LENGTH) {
    throw new GithubIntegrationValidationError(
      `Organization name must be at most ${GITHUB_ORGANIZATION_NAME_MAX_LENGTH} characters.`,
    );
  }

  if (!GITHUB_ORGANIZATION_NAME_PATTERN.test(trimmed)) {
    throw new GithubIntegrationValidationError(
      'Organization name may only contain letters, numbers, and hyphens.',
    );
  }

  return trimmed.toLowerCase();
}
