export type GithubIntegration = {
  id: string;
  organizationName: string;
  createdAt: string;
  updatedAt: string;
};

type ApiErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'MISSING_APP_TOKEN'
  | 'INVALID_APP_TOKEN'
  | 'DUPLICATE_GITHUB_INTEGRATION_LOGIN';

type ErrorResponse = {
  code: ApiErrorCode;
  message: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export class GithubIntegrationsApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'GithubIntegrationsApiError';
    this.code = code;
  }
}

async function parseError(response: Response): Promise<GithubIntegrationsApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // ignored
  }

  return new GithubIntegrationsApiError(
    payload?.code ?? 'FORBIDDEN',
    payload?.message ?? 'Request failed.',
  );
}

export async function listGithubIntegrations(accessToken: string): Promise<GithubIntegration[]> {
  const response = await fetch(`${API_BASE_URL}/github-integrations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { integrations: GithubIntegration[] };
  return payload.integrations;
}

export async function enableGithubIntegration(
  accessToken: string,
  organizationName: string,
): Promise<GithubIntegration> {
  const response = await fetch(`${API_BASE_URL}/github-integrations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organizationName }),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { integration: GithubIntegration };
  return payload.integration;
}

export async function disableGithubIntegration(
  accessToken: string,
  integrationId: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/github-integrations/${integrationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }
}
