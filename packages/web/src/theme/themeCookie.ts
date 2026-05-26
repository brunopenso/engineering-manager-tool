import type { ThemeMode } from './appTheme.js';

export const THEME_COOKIE_NAME = 'em_tool_theme';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function isThemeMode(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function getThemeFromCookie(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'light';
  }

  const cookies = document.cookie.split(';').map((part) => part.trim());

  for (const cookie of cookies) {
    if (!cookie.startsWith(`${THEME_COOKIE_NAME}=`)) {
      continue;
    }

    const value = decodeURIComponent(cookie.slice(THEME_COOKIE_NAME.length + 1));

    if (isThemeMode(value)) {
      return value;
    }
  }

  return 'light';
}

export function setThemeCookie(mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }

  const encodedValue = encodeURIComponent(mode);
  document.cookie = `${THEME_COOKIE_NAME}=${encodedValue}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
