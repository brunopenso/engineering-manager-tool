import type { AuthUser } from '../auth/AuthProvider.js';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type ApiErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'MISSING_APP_TOKEN'
  | 'INVALID_APP_TOKEN';

export class UsersApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'UsersApiError';
    this.code = code;
  }
}

type ErrorResponse = {
  code: ApiErrorCode;
  message: string;
};

export type RoleChangeRequest = {
  role: 'LEADER' | 'ADMINISTRATOR';
  action: 'GRANT' | 'REVOKE';
};

export type LeaderCreateUserRequest = {
  fullName: string;
  email: string;
  role: string;
};

export type LeaderCreatedUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  leaderId: string;
  createdByUserId: string;
  createdAt: string;
};

async function parseError(response: Response): Promise<UsersApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // fallback below
  }

  return new UsersApiError(
    payload?.code ?? 'FORBIDDEN',
    payload?.message ?? 'Request failed.',
  );
}

export async function listUsers(accessToken: string): Promise<AuthUser[]> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { users: AuthUser[] };
  return payload.users;
}

export async function updateUserRole(
  accessToken: string,
  userId: string,
  change: RoleChangeRequest,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/roles`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(change),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { user: AuthUser };
  return payload.user;
}

export async function createUser(
  accessToken: string,
  input: LeaderCreateUserRequest,
): Promise<LeaderCreatedUser> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { user: LeaderCreatedUser };
  return payload.user;
}
