import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testAdminUser } from '../../src/test/renderWithProviders.js';

describe('US4 admin users combined filters', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows filtered empty state when no users match', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.match(/\/users(\?|$)/)) {
          return { ok: true, json: async () => ({ users: [] }) };
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
      expect(screen.getByTestId('admin-users-name-filter')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('admin-users-name-filter'), {
      target: { value: 'Nobody' },
    });

    await waitFor(
      () => {
        expect(screen.getByText(/No users match your filters/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('clears filters and requests unfiltered user list', async () => {
    const fetchCalls: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        fetchCalls.push(url);

        if (url.match(/\/users(\?|$)/)) {
          return { ok: true, json: async () => ({ users: [testAdminUser] }) };
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
      expect(screen.getByTestId('admin-users-name-filter')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('admin-users-name-filter'), {
      target: { value: 'Admin' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-clear-filters')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('admin-users-clear-filters'));

    await waitFor(() => {
      const userCalls = fetchCalls.filter((url) => url.match(/\/users(\?|$)/));
      const lastCall = userCalls[userCalls.length - 1] ?? '';
      expect(lastCall).not.toContain('name=');
      expect(lastCall).not.toContain('email=');
      expect(lastCall).not.toContain('roles=');
    });
  });

  it('refetches with active filters after grant role', async () => {
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        fetchCalls.push({ url, init });

        if (url.includes('/roles') && init?.method === 'PATCH') {
          return {
            ok: true,
            json: async () => ({ user: { ...testAdminUser, roles: ['COLLABORATOR', 'LEADER'] } }),
          };
        }

        if (url.match(/\/users(\?|$)/)) {
          return { ok: true, json: async () => ({ users: [testAdminUser] }) };
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
      expect(screen.getByText('Grant Leader')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('admin-users-name-filter'), {
      target: { value: 'System' },
    });

    await waitFor(
      () => {
        expect(fetchCalls.some((call) => call.url.includes('name=System'))).toBe(true);
      },
      { timeout: 2000 },
    );

    const isUserListGet = (call: { url: string; init?: RequestInit }) =>
      call.url.match(/\/users(\?|$)/) !== null &&
      (!call.init?.method || call.init.method === 'GET');

    const callsBeforeGrant = fetchCalls.filter(isUserListGet).length;

    fireEvent.click(screen.getByText('Grant Leader'));

    await waitFor(() => {
      const listCalls = fetchCalls.filter(isUserListGet);
      expect(listCalls.length).toBeGreaterThan(callsBeforeGrant);
      expect(listCalls[listCalls.length - 1]?.url).toContain('name=System');
    });
  });
});
