import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testAdminUser } from '../../src/test/renderWithProviders.js';

describe('US2 admin users email filter', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('debounces email filter and sends email query param', async () => {
    const fetchCalls: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        fetchCalls.push(url);

        if (url.match(/\/users(\?|$)/)) {
          return {
            ok: true,
            json: async () => ({ users: [testAdminUser] }),
          };
        }

        return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected' }) };
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/admin/users',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-email-filter')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('admin-users-email-filter'), {
      target: { value: 'admin@' },
    });

    await waitFor(
      () => {
        expect(fetchCalls.some((url) => url.includes('email=admin%40'))).toBe(true);
      },
      { timeout: 2000 },
    );
  });
});
