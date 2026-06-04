import { AUTH_ERROR_CODES } from '../auth/types.js';

export type ThemePreference = 'light' | 'dark';

export type ProfileSettingsInput = {
  themePreference?: unknown;
  githubLogin?: unknown;
};

export type ParsedProfileSettingsUpdate = {
  themePreference?: ThemePreference;
  githubLogin?: string | null;
};

export class UserProfileValidationError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'UserProfileValidationError';
    this.code = AUTH_ERROR_CODES.VALIDATION_ERROR;
  }
}

const GITHUB_LOGIN_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const GITHUB_LOGIN_MAX_LENGTH = 39;

export function parseThemePreference(value: unknown): ThemePreference {
  if (value !== 'light' && value !== 'dark') {
    throw new UserProfileValidationError('Appearance preference must be light or dark.');
  }

  return value;
}

export function parseGithubLogin(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new UserProfileValidationError('GitHub login must be a string.');
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > GITHUB_LOGIN_MAX_LENGTH) {
    throw new UserProfileValidationError(
      `GitHub login must be at most ${GITHUB_LOGIN_MAX_LENGTH} characters.`,
    );
  }

  if (!GITHUB_LOGIN_PATTERN.test(trimmed)) {
    throw new UserProfileValidationError(
      'GitHub login may only contain letters, numbers, and hyphens.',
    );
  }

  return trimmed;
}

export function parseProfileSettingsUpdate(
  input: ProfileSettingsInput,
): ParsedProfileSettingsUpdate {
  const hasTheme = Object.prototype.hasOwnProperty.call(input, 'themePreference');
  const hasGithub = Object.prototype.hasOwnProperty.call(input, 'githubLogin');

  if (!hasTheme && !hasGithub) {
    throw new UserProfileValidationError(
      'At least one of themePreference or githubLogin is required.',
    );
  }

  const update: ParsedProfileSettingsUpdate = {};

  if (hasTheme) {
    update.themePreference = parseThemePreference(input.themePreference);
  }

  if (hasGithub) {
    update.githubLogin = parseGithubLogin(input.githubLogin);
  }

  return update;
}
