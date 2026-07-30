import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from '../../src/pages/ProfilePage.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { patchMyProfile, ProfileApiError } from '../../src/services/profileApi.js';
import i18n from '../../src/i18n/config.js';

vi.mock('../../src/services/profileApi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/profileApi.js')>();
  return {
    ...actual,
    patchMyProfile: vi.fn(),
  };
});

describe('US3 profile locale persistence', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en-US');
  });

  it('persists pt-BR via profile PATCH', async () => {
    const user = userEvent.setup();
    vi.mocked(patchMyProfile).mockResolvedValue({
      ...testUser,
      languagePreference: 'pt-BR',
    });

    renderWithProviders(<ProfilePage />, { isAuthenticated: true, user: testUser });

    await user.click(screen.getByRole('button', { name: 'Portuguese (Brazil)' }));
    expect(patchMyProfile).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(patchMyProfile).toHaveBeenCalledWith('token-123', {
        languagePreference: 'pt-BR',
      });
    });
  });

  it('shows error on failed Save', async () => {
    const user = userEvent.setup();
    vi.mocked(patchMyProfile).mockRejectedValue(
      new ProfileApiError('VALIDATION_ERROR', 'Save failed'),
    );

    renderWithProviders(<ProfilePage />, { isAuthenticated: true, user: testUser });

    await user.click(screen.getByRole('button', { name: 'Portuguese (Brazil)' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
    expect(screen.getByRole('heading', { name: 'Your profile' })).toBeInTheDocument();
  });

  it('restores pt-BR from user profile on new session render', async () => {
    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: { ...testUser, languagePreference: 'pt-BR' },
    });

    expect(await screen.findByRole('heading', { name: 'Seu perfil' })).toBeInTheDocument();
  });
});
