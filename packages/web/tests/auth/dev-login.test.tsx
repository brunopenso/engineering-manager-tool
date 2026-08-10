import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../../src/pages/LoginPage.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';
import type { ReactNode } from 'react';

const { listDevUsersMock, loginWithDevUserMock, isDevAuthEnabledInWebMock } = vi.hoisted(() => ({
  listDevUsersMock: vi.fn(),
  loginWithDevUserMock: vi.fn(),
  isDevAuthEnabledInWebMock: vi.fn(),
}));

vi.mock('@react-oauth/google', async () => {
  const React = await import('react');

  return {
    GoogleOAuthProvider: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    GoogleLogin: () =>
      React.createElement(
        'button',
        { type: 'button', 'data-testid': 'google-login' },
        'Google login',
      ),
  };
});

vi.mock('../../src/services/authApi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/authApi.js')>();
  return {
    ...actual,
    isDevAuthEnabledInWeb: isDevAuthEnabledInWebMock,
    listDevUsers: listDevUsersMock,
    loginWithDevUser: loginWithDevUserMock,
  };
});

describe('LoginPage dev auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDevAuthEnabledInWebMock.mockReturnValue(false);
    listDevUsersMock.mockResolvedValue([]);
  });

  it('hides the development login section when dev auth is disabled', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.queryByText(/Development-only login/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Sign in as selected user' }),
    ).not.toBeInTheDocument();
  });

  it('signs in as a selected dev user and navigates to the app', async () => {
    isDevAuthEnabledInWebMock.mockReturnValue(true);
    listDevUsersMock.mockResolvedValue([
      {
        id: 'leader-1',
        email: 'leader@example.com',
        fullName: 'Team Leader',
        roles: ['COLLABORATOR', 'LEADER'],
      },
    ]);
    loginWithDevUserMock.mockResolvedValue({
      accessToken: 'dev-token',
      redirectPath: '/app',
      welcomeMessage: 'Welcome to the system',
      user: {
        id: 'leader-1',
        email: 'leader@example.com',
        fullName: 'Team Leader',
        firstLoginAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: '2026-01-01T00:00:00.000Z',
        roles: ['COLLABORATOR', 'LEADER'],
      },
    });

    renderWithProviders(<LoginPage />, { initialPath: '/login' });

    await waitFor(() => {
      expect(screen.getByText(/Development-only login/i)).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sign in as selected user' }));

    await waitFor(() => {
      expect(loginWithDevUserMock).toHaveBeenCalledWith({ userId: 'leader-1' });
    });
  });
});
