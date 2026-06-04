import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuthThemeSync from '../../src/auth/AuthThemeSync.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { THEME_COOKIE_NAME } from '../../src/theme/themeCookie.js';

function readThemeCookie(): string | null {
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${THEME_COOKIE_NAME}=`));

  return match ? decodeURIComponent(match.slice(THEME_COOKIE_NAME.length + 1)) : null;
}

describe('US3 auth theme bootstrap', () => {
  it('applies dark theme from authenticated user on mount', async () => {
    document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0`;

    renderWithProviders(
      <>
        <AuthThemeSync />
        <div data-testid="theme-sentinel">loaded</div>
      </>,
      {
        isAuthenticated: true,
        user: { ...testUser, themePreference: 'dark' },
      },
    );

    expect(screen.getByTestId('theme-sentinel')).toBeInTheDocument();

    await waitFor(() => {
      expect(readThemeCookie()).toBe('dark');
    });
  });
});
