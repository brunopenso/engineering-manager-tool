export const LANGUAGE_PREFERENCES = ['en-US', 'pt-BR'] as const;

export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number];

export const DEFAULT_LANGUAGE_PREFERENCE: LanguagePreference = 'en-US';

export const DATE_FORMAT_PREFERENCES = ['MDY', 'DMY', 'YMD'] as const;

export type DateFormatPreference = (typeof DATE_FORMAT_PREFERENCES)[number];

export const DEFAULT_DATE_FORMAT_PREFERENCE: DateFormatPreference = 'MDY';
