import App from '../../src/App.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { LOGIN_HEADING } from '../../src/test/testHelpers.js';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STORAGE_KEY } from '../../src/auth/sessionStorage.js';
import { AuthApiError } from '../../src/services/authApi.js';

const { refreshSessionMock } = vi.hoisted(() => ({
  refreshSessionMock: vi.fn(),
}));

vi.mock('../../src/services/authApi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/authApi.js')>();
  return {
    ...actual,
    refreshSession: refreshSessionMock,
  };
});

describe('US1 auth bootstrap', () => {
  beforeEach(() => {
    window.localStorage.clear();
    refreshSessionMock.mockReset();
  });

  it('restores session from storage on app load', async () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ accessToken: 'persisted-token' }),
    );
    refreshSessionMock.mockResolvedValue({
      accessToken: 'renewed-token',
      user: testUser,
    });

    renderWithProviders(<App />, {
      initialPath: '/app',
      enableSessionBootstrap: true,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    });
    expect(refreshSessionMock).toHaveBeenCalledWith('persisted-token');
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toContain('renewed-token');
  });

  it('clears invalid stored session and redirects to login', async () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ accessToken: 'expired-token' }),
    );
    refreshSessionMock.mockRejectedValue(
      new AuthApiError('INVALID_APP_TOKEN', 'Authentication token is invalid.'),
    );

    renderWithProviders(<App />, {
      initialPath: '/app',
      enableSessionBootstrap: true,
      user: { ...testUser, email: 'manager@example.com' },
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: LOGIN_HEADING })).toBeInTheDocument();
    });
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
