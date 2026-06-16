import type { LanguagePreference } from '../types/profilePreferences.js';

export function formatDisplayNumber(
  value: number,
  languagePreference: LanguagePreference = 'en-US',
): string {
  return new Intl.NumberFormat(languagePreference).format(value);
}
