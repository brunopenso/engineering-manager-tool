import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from '../../src/pages/ProfilePage.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { patchMyProfile, ProfileApiError } from '../../src/services/profileApi.js';

vi.mock('../../src/services/profileApi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/profileApi.js')>();
  return {
    ...actual,
    patchMyProfile: vi.fn(),
  };
});

describe('US2 profile page github login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves github login through the page Save action', async () => {
    const user = userEvent.setup();
    vi.mocked(patchMyProfile).mockResolvedValue({
      ...testUser,
      githubLogin: 'acme-dev',
    });

    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: testUser,
    });

    const input = screen.getByLabelText('GitHub login');
    await user.clear(input);
    await user.type(input, 'acme-dev');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(patchMyProfile).toHaveBeenCalledWith('token-123', {
        githubLogin: 'acme-dev',
      });
    });

    expect(input).toHaveValue('acme-dev');
    expect(
      screen.getByText('Profile changes saved successfully.'),
    ).toBeInTheDocument();
  });

  it('shows validation error from api', async () => {
    const user = userEvent.setup();
    vi.mocked(patchMyProfile).mockRejectedValue(
      new ProfileApiError('VALIDATION_ERROR', 'GitHub login is invalid.'),
    );

    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: testUser,
    });

    await user.type(screen.getByLabelText('GitHub login'), 'bad handle!');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('GitHub login is invalid.');
  });
});
