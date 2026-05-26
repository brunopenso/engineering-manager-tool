import { afterEach, describe, expect, it } from 'vitest';
import {
  THEME_COOKIE_NAME,
  getThemeFromCookie,
  setThemeCookie,
} from './themeCookie.js';

function clearThemeCookie(): void {
  document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0`;
}

describe('themeCookie', () => {
  afterEach(() => {
    clearThemeCookie();
  });

  it('defaults to light when cookie is missing', () => {
    clearThemeCookie();
    expect(getThemeFromCookie()).toBe('light');
  });

  it('reads light from cookie', () => {
    setThemeCookie('light');
    expect(getThemeFromCookie()).toBe('light');
  });

  it('reads dark from cookie', () => {
    setThemeCookie('dark');
    expect(getThemeFromCookie()).toBe('dark');
  });

  it('defaults to light for invalid cookie values', () => {
    document.cookie = `${THEME_COOKIE_NAME}=invalid; path=/`;
    expect(getThemeFromCookie()).toBe('light');
  });

  it('persists mode when setting cookie', () => {
    setThemeCookie('dark');
    expect(document.cookie).toContain(`${THEME_COOKIE_NAME}=dark`);
    expect(getThemeFromCookie()).toBe('dark');

    setThemeCookie('light');
    expect(getThemeFromCookie()).toBe('light');
  });
});
