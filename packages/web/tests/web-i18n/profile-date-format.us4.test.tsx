import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from '../../src/pages/ProfilePage.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { patchMyProfile } from '../../src/services/profileApi.js';

vi.mock('../../src/services/profileApi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/profileApi.js')>();
  return {
    ...actual,
    patchMyProfile: vi.fn(),
  };
});

describe('US4 profile date format', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists DMY date format via profile PATCH', async () => {
    const user = userEvent.setup();
    vi.mocked(patchMyProfile).mockResolvedValue({
      ...testUser,
      dateFormatPreference: 'DMY',
    });

    renderWithProviders(<ProfilePage />, { isAuthenticated: true, user: testUser });

    await user.click(screen.getByRole('button', { name: /Day \/ Month \/ Year/i }));

    await waitFor(() => {
      expect(patchMyProfile).toHaveBeenCalledWith('token-123', {
        dateFormatPreference: 'DMY',
      });
    });
  });
});
