import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders, testAdminUser } from '../src/test/renderWithProviders.js';

describe('US3 admin users page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders user role management for administrators', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [testAdminUser],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/admin/users',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await waitFor(() => {
      expect(screen.getByText('User role management')).toBeInTheDocument();
    });

    const listCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/users'));
    expect(listCall).toBeDefined();
    expect(String(listCall?.[0])).not.toContain('name=');
    expect(String(listCall?.[0])).not.toContain('email=');
    expect(String(listCall?.[0])).not.toContain('roles=');
  });
});
