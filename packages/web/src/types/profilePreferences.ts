export const LANGUAGE_PREFERENCES = ['en-US', 'pt-BR'] as const;

export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number];

export const DEFAULT_LANGUAGE_PREFERENCE: LanguagePreference = 'en-US';

export const DATE_FORMAT_PREFERENCE_MDY = 'MDY' as const;
export const DATE_FORMAT_PREFERENCE_DMY = 'DMY' as const;
export const DATE_FORMAT_PREFERENCE_YMD = 'YMD' as const;

export const DATE_FORMAT_PREFERENCES = [
  DATE_FORMAT_PREFERENCE_MDY,
  DATE_FORMAT_PREFERENCE_DMY,
  DATE_FORMAT_PREFERENCE_YMD,
] as const;

export type DateFormatPreference = (typeof DATE_FORMAT_PREFERENCES)[number];

export const DEFAULT_DATE_FORMAT_PREFERENCE: DateFormatPreference = DATE_FORMAT_PREFERENCE_MDY;
