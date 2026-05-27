import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import ProfilePage from '../src/pages/ProfilePage.js';
import { THEME_COOKIE_NAME } from '../src/theme/themeCookie.js';
import { renderWithProviders, testUser } from '../src/test/renderWithProviders.js';

function clearThemeCookie(): void {
  document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0`;
}

describe('profile theme preference', () => {
  afterEach(() => {
    clearThemeCookie();
  });

  it('renders appearance controls and persists dark theme to cookie', async () => {
    const user = userEvent.setup();
    clearThemeCookie();

    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: testUser,
    });

    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Dark theme' }));

    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(document.cookie).toContain(`${THEME_COOKIE_NAME}=dark`);
  });
});
