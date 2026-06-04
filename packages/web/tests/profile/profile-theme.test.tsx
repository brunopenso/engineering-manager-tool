import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuthThemeSync from '../../src/auth/AuthThemeSync.js';
import ProfilePage from '../../src/pages/ProfilePage.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import * as profileApi from '../../src/services/profileApi.js';

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
});
