import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeliverablesPage from '../pages/DeliverablesPage.js';
import { renderWithProviders } from '../test/renderWithProviders.js';

describe('US1 deliverable creation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(
    'submits create form and refreshes list',
    async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ deliverables: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            deliverable: {
              id: 'del-1',
              ownerUserId: 'user-1',
              title: 'API redesign',
              businessImpact: 'HIGH',
              systemTags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
              updatedAt: '2026-05-26T00:00:00.000Z',
              description: 'Desc',
              roleInDeliverable: 'Lead',
              improvementPoints: 'Docs',
              technicalDescription: null,
              userTags: [],
              links: [],
              createdAt: '2026-05-26T00:00:00.000Z',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            deliverables: [
              {
                id: 'del-1',
                ownerUserId: 'user-1',
                title: 'API redesign',
                businessImpact: 'HIGH',
                systemTags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
                updatedAt: '2026-05-26T00:00:00.000Z',
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
        });
      vi.stubGlobal('fetch', fetchMock);

      renderWithProviders(<DeliverablesPage />, { isAuthenticated: true });

      await waitFor(() => {
        expect(screen.queryByText('Loading deliverables…')).not.toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Add deliverable' }));
      const createDialog = await screen.findByRole('dialog');

      fireEvent.change(within(createDialog).getByRole('textbox', { name: 'Title' }), {
        target: { value: 'API redesign' },
      });
      fireEvent.change(within(createDialog).getByRole('textbox', { name: 'Description' }), {
        target: { value: 'Shipped new API' },
      });
      fireEvent.change(
        within(createDialog).getByRole('textbox', { name: 'Your role in this deliverable' }),
        { target: { value: 'Tech lead' } },
      );
      fireEvent.change(
        within(createDialog).getByRole('textbox', {
          name: 'Personal performance improvement points',
        }),
        { target: { value: 'Write more docs' } },
      );

      await userEvent.click(within(createDialog).getByRole('button', { name: 'Platform' }));
      await userEvent.click(within(createDialog).getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(screen.getByText('API redesign')).toBeInTheDocument();
      });
    },
    15000,
  );
});
