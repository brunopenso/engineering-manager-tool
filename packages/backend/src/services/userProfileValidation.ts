import { AUTH_ERROR_CODES } from '../auth/types.js';

export type ThemePreference = 'light' | 'dark';

export type LanguagePreference = 'en' | 'es' | 'de' | 'fr' | 'pt';

export type DateFormatPreference = 'MDY' | 'DMY' | 'YMD';

export type ProfileSettingsInput = {
  themePreference?: unknown;
  githubLogin?: unknown;
  languagePreference?: unknown;
  dateFormatPreference?: unknown;
};

export type ParsedProfileSettingsUpdate = {
  themePreference?: ThemePreference;
  githubLogin?: string | null;
  languagePreference?: LanguagePreference;
  dateFormatPreference?: DateFormatPreference;
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

const LANGUAGE_PREFERENCES: LanguagePreference[] = ['en', 'es', 'de', 'fr', 'pt'];
const DATE_FORMAT_PREFERENCES: DateFormatPreference[] = ['MDY', 'DMY', 'YMD'];

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

export function parseLanguagePreference(value: unknown): LanguagePreference {
  if (typeof value !== 'string' || !LANGUAGE_PREFERENCES.includes(value as LanguagePreference)) {
    throw new UserProfileValidationError(
      'Language preference must be one of: en, es, de, fr, pt.',
    );
  }

  return value as LanguagePreference;
}

export function parseDateFormatPreference(value: unknown): DateFormatPreference {
  if (
    typeof value !== 'string' ||
    !DATE_FORMAT_PREFERENCES.includes(value as DateFormatPreference)
  ) {
    throw new UserProfileValidationError(
      'Date format preference must be one of: MDY, DMY, YMD.',
    );
  }

  return value as DateFormatPreference;
}

export function parseProfileSettingsUpdate(
  input: ProfileSettingsInput,
): ParsedProfileSettingsUpdate {
  const hasTheme = Object.prototype.hasOwnProperty.call(input, 'themePreference');
  const hasGithub = Object.prototype.hasOwnProperty.call(input, 'githubLogin');
  const hasLanguage = Object.prototype.hasOwnProperty.call(input, 'languagePreference');
  const hasDateFormat = Object.prototype.hasOwnProperty.call(input, 'dateFormatPreference');

  if (!hasTheme && !hasGithub && !hasLanguage && !hasDateFormat) {
    throw new UserProfileValidationError(
      'At least one of themePreference, githubLogin, languagePreference, or dateFormatPreference is required.',
    );
  }

  const update: ParsedProfileSettingsUpdate = {};

  if (hasTheme) {
    update.themePreference = parseThemePreference(input.themePreference);
  }

  if (hasGithub) {
    update.githubLogin = parseGithubLogin(input.githubLogin);
  }

  if (hasLanguage) {
    update.languagePreference = parseLanguagePreference(input.languagePreference);
  }

  if (hasDateFormat) {
    update.dateFormatPreference = parseDateFormatPreference(input.dateFormatPreference);
  }

  return update;
}
