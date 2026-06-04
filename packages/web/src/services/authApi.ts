const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

const DEV_AUTH_ENABLED = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';
const DEV_AUTH_SECRET = import.meta.env.VITE_DEV_AUTH_SECRET ?? '';

export function isDevAuthEnabledInWeb(): boolean {
  return DEV_AUTH_ENABLED;
}

type AuthErrorCode =
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'ISSUER_MISMATCH'
  | 'AUDIENCE_MISMATCH'
  | 'MISSING_APP_TOKEN'
  | 'INVALID_APP_TOKEN'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR';

export type UserRoleType = 'COLLABORATOR' | 'LEADER' | 'ADMINISTRATOR';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  firstLoginAt: string;
  lastLoginAt: string;
  roles: UserRoleType[];
  themePreference: 'light' | 'dark';
  githubLogin: string | null;
};

type LoginResponse = {
  accessToken: string;
  redirectPath: string;
  welcomeMessage: string;
  user: AuthUser;
};

type RefreshResponse = {
  accessToken: string;
  user: AuthUser;
};

export class AuthApiError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
  }
}

type ErrorResponse = {
  code: AuthErrorCode;
  message: string;
};

async function parseError(response: Response): Promise<AuthApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // fallback below
  }

  return new AuthApiError(
    payload?.code ?? 'INVALID_TOKEN',
    payload?.message ?? 'Authentication failed.',
  );
}

export async function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as LoginResponse;
}

export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { user: AuthUser };
  return payload.user;
}

export async function refreshSession(accessToken: string): Promise<RefreshResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as RefreshResponse;
}

export type DevAuthUser = {
  id: string;
  email: string;
  fullName: string;
  roles: UserRoleType[];
};

function devAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Dev-Auth-Secret': DEV_AUTH_SECRET,
  };
}

export async function listDevUsers(): Promise<DevAuthUser[]> {
  const response = await fetch(`${API_BASE_URL}/auth/dev/users`, {
    headers: devAuthHeaders(),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { users: DevAuthUser[] };
  return payload.users;
}

export async function loginWithDevUser(input: {
  userId?: string;
  email?: string;
  fullName?: string;
}): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/dev/login`, {
    method: 'POST',
    headers: devAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as LoginResponse;
}
