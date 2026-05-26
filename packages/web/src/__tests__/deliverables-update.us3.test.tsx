import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeliverablesPage from '../pages/DeliverablesPage.js';
import { renderWithProviders } from '../test/renderWithProviders.js';

describe('US3 deliverable update', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(
    'opens edit dialog and saves changes',
    async () => {
      const summary = {
        id: 'del-1',
        ownerUserId: 'user-1',
        title: 'API redesign',
        businessImpact: 'HIGH',
        systemTags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
        updatedAt: '2026-05-26T00:00:00.000Z',
      };

      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ deliverables: [summary] }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              readOnly: false,
              deliverable: {
                ...summary,
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
              deliverable: { ...summary, title: 'API redesign v2' },
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ deliverables: [{ ...summary, title: 'API redesign v2' }] }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
          }),
      );

      renderWithProviders(<DeliverablesPage />, { isAuthenticated: true });

      await waitFor(() => {
        expect(screen.getByText('API redesign')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
      const editDialog = await screen.findByRole('dialog');
      const titleField = within(editDialog).getByRole('textbox', { name: 'Title' });
      fireEvent.change(titleField, { target: { value: 'API redesign v2' } });
      await userEvent.click(within(editDialog).getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(screen.getByText('API redesign v2')).toBeInTheDocument();
      });
    },
    15000,
  );
});
