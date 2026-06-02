import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testAdminUser } from '../../src/test/renderWithProviders.js';

describe('US1 admin users name filter', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not send name query param until at least 3 characters', async () => {
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
      expect(screen.getByTestId('admin-users-name-filter')).toBeInTheDocument();
    });

    const callsBefore = fetchCalls.filter((url) => url.match(/\/users(\?|$)/)).length;

    fireEvent.change(screen.getByTestId('admin-users-name-filter'), {
      target: { value: 'Ab' },
    });

    await waitFor(
      () => {
        expect(screen.getByText(/Enter at least 3 characters to search/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await waitFor(
      () => {
        const callsAfter = fetchCalls.filter((url) => url.match(/\/users(\?|$)/));
        expect(callsAfter.length).toBeGreaterThan(callsBefore);
        expect(callsAfter.every((url) => !url.includes('name='))).toBe(true);
      },
      { timeout: 2000 },
    );
  });

  it('debounces name filter and sends name query param', async () => {
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
      expect(screen.getByTestId('admin-users-name-filter')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('admin-users-name-filter'), {
      target: { value: 'Admin' },
    });

    await waitFor(
      () => {
        expect(fetchCalls.some((url) => url.includes('name=Admin'))).toBe(true);
      },
      { timeout: 2000 },
    );
  });
});
