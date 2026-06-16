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

describe('US2 profile language', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('switches UI to Portuguese when selecting pt-BR', async () => {
    const user = userEvent.setup();
    vi.mocked(patchMyProfile).mockResolvedValue({
      ...testUser,
      languagePreference: 'pt-BR',
    });

    renderWithProviders(<ProfilePage />, { isAuthenticated: true, user: testUser });

    await user.click(screen.getByRole('button', { name: 'Portuguese (Brazil)' }));

    await waitFor(() => {
      expect(patchMyProfile).toHaveBeenCalledWith('token-123', {
        languagePreference: 'pt-BR',
      });
    });

    expect(screen.getByRole('heading', { name: 'Seu perfil' })).toBeInTheDocument();
  });
});
