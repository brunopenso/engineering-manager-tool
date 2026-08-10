import type { AuthUser } from '../auth/AuthProvider.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type ApiErrorCode = 'VALIDATION_ERROR' | 'MISSING_APP_TOKEN' | 'INVALID_APP_TOKEN' | 'NOT_FOUND';

export class ProfileApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ProfileApiError';
    this.code = code;
  }
}

type ErrorResponse = {
  code: ApiErrorCode;
  message: string;
};

import type { DateFormatPreference, LanguagePreference } from '../types/profilePreferences.js';

export type ProfileSettingsUpdate = {
  themePreference?: 'light' | 'dark';
  githubLogin?: string | null;
  languagePreference?: LanguagePreference;
  dateFormatPreference?: DateFormatPreference;
};

async function parseError(response: Response): Promise<ProfileApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    payload = null;
  }

  const code = payload?.code ?? 'VALIDATION_ERROR';
  const message = payload?.message ?? 'Profile update failed.';

  return new ProfileApiError(code, message);
}

export async function patchMyProfile(
  accessToken: string,
  body: ProfileSettingsUpdate,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { user: AuthUser };
  return payload.user;
}
