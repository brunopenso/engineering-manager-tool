const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type AuthErrorCode =
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'ISSUER_MISMATCH'
  | 'AUDIENCE_MISMATCH'
  | 'MISSING_APP_TOKEN'
  | 'INVALID_APP_TOKEN';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  firstLoginAt: string;
  lastLoginAt: string;
};

type LoginResponse = {
  accessToken: string;
  redirectPath: string;
  welcomeMessage: string;
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
