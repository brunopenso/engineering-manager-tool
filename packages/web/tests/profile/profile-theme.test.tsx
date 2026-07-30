import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AuthThemeSync from '../../src/auth/AuthThemeSync.js';
import ProfilePage from '../../src/pages/ProfilePage.js';
import App from '../../src/App.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';

vi.mock('../../src/services/profileApi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/profileApi.js')>();
  return {
    ...actual,
    patchMyProfile: vi.fn(),
  };
});

describe('profile theme preference', () => {
  it('renders appearance controls from user theme preference', () => {
    renderWithProviders(
      <>
        <AuthThemeSync />
        <ProfilePage />
      </>,
      {
        isAuthenticated: true,
        user: { ...testUser, themePreference: 'dark' },
      },
    );

    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('navigates back to home when clicking Cancel', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />, {
      initialPath: '/app/profile',
      isAuthenticated: true,
      user: testUser,
    });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });
});
