import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from '../../src/pages/ProfilePage.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { THEME_COOKIE_NAME } from '../../src/theme/themeCookie.js';

function clearThemeCookie(): void {
  document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0`;
}
import {
  patchMyProfile,
  ProfileApiError,
} from '../../src/services/profileApi.js';

vi.mock('../../src/services/profileApi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/profileApi.js')>();
  return {
    ...actual,
    patchMyProfile: vi.fn(),
  };
});

describe('US1 profile page theme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearThemeCookie();
  });

  it('calls patchMyProfile when selecting dark theme', async () => {
    const user = userEvent.setup();
    vi.mocked(patchMyProfile).mockResolvedValue({
      ...testUser,
      themePreference: 'dark',
    });

    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: testUser,
    });

    await user.click(screen.getByRole('button', { name: 'Dark theme' }));

    await waitFor(() => {
      expect(patchMyProfile).toHaveBeenCalledWith('token-123', {
        themePreference: 'dark',
      });
    });

    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('reverts theme and shows error when patch fails', async () => {
    const user = userEvent.setup();
    vi.mocked(patchMyProfile).mockRejectedValue(
      new ProfileApiError('VALIDATION_ERROR', 'Could not save.'),
    );

    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: testUser,
    });

    await user.click(screen.getByRole('button', { name: 'Dark theme' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not save.');

    expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
