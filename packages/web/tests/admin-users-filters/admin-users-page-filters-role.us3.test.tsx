import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testAdminUser } from '../../src/test/renderWithProviders.js';

describe('US3 admin users role filter', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refetches immediately with roles query param when role selected', async () => {
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
      expect(screen.getByTestId('admin-users-role-filter')).toBeInTheDocument();
    });

    const select = screen.getByTestId('admin-users-role-filter');
    fireEvent.mouseDown(select.querySelector('[role="combobox"]')!);
    await userEvent.click(await screen.findByRole('option', { name: 'Leader' }));

    await waitFor(() => {
      expect(fetchCalls.some((url) => url.includes('roles=LEADER'))).toBe(true);
    });
  });
});
