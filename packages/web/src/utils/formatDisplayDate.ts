import type { DateFormatPreference, LanguagePreference } from '../types/profilePreferences.js';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function dateParts(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function separatorForLanguage(languagePreference: LanguagePreference): string {
  return languagePreference === 'pt-BR' ? '/' : '/';
}

export function formatDisplayDate(
  value: Date | string,
  dateFormatPreference: DateFormatPreference,
  languagePreference: LanguagePreference = 'en-US',
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const { year, month, day } = dateParts(date);
  const sep = separatorForLanguage(languagePreference);
  const y = String(year);
  const m = pad2(month);
  const d = pad2(day);

  switch (dateFormatPreference) {
    case 'DMY':
      return `${d}${sep}${m}${sep}${y}`;
    case 'YMD':
      return `${y}${sep}${m}${sep}${d}`;
    case 'MDY':
    default:
      return `${m}${sep}${d}${sep}${y}`;
  }
}

export function formatDisplayDateTime(
  value: Date | string,
  dateFormatPreference: DateFormatPreference,
  languagePreference: LanguagePreference = 'en-US',
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const datePart = formatDisplayDate(date, dateFormatPreference, languagePreference);
  const timePart = date.toLocaleTimeString(languagePreference, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${datePart} ${timePart}`;
}
