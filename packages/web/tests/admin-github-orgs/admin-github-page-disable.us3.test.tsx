import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testAdminUser } from '../../src/test/renderWithProviders.js';

describe('US3 disable GitHub organization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('removes the organization after disable confirmation', async () => {
    const integration = {
      id: 'integration-1',
      login: 'acme-corp',
      createdAt: '2026-06-04T12:00:00.000Z',
      updatedAt: '2026-06-04T12:00:00.000Z',
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ integrations: [integration] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ integrations: [] }),
      });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/admin/github',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await waitFor(() => {
      expect(screen.getByText('acme-corp')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Disable' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Disable' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'No GitHub organizations enabled yet. Add the first organization login above to enable integration scope.',
        ),
      ).toBeInTheDocument();
    });

    expect(fetchMock.mock.calls[1]?.[0]).toContain('/github-integrations/integration-1');
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});
