import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testAdminUser } from '../../src/test/renderWithProviders.js';

describe('US2 enable GitHub organization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls enable API and shows the new organization row', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ integrations: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          integration: {
            id: 'integration-1',
            login: 'acme-corp',
            createdAt: '2026-06-04T12:00:00.000Z',
            updatedAt: '2026-06-04T12:00:00.000Z',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          integrations: [
            {
              id: 'integration-1',
              login: 'acme-corp',
              createdAt: '2026-06-04T12:00:00.000Z',
              updatedAt: '2026-06-04T12:00:00.000Z',
            },
          ],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/admin/github',
      isAuthenticated: true,
      user: testAdminUser,
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Organization login')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Organization login'), {
      target: { value: 'acme-corp' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enable organization' }));

    await waitFor(() => {
      expect(screen.getByText('acme-corp')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ login: 'acme-corp' }),
    });
  });
});
