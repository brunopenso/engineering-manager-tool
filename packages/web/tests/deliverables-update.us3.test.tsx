import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders } from '../src/test/renderWithProviders.js';

describe('US3 deliverable update', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(
    'opens edit screen and saves changes',
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
          }),
      );

      renderWithProviders(<App />, {
        initialPath: '/app/deliverables/del-1/edit',
        isAuthenticated: true,
      });

      await screen.findByRole('heading', { name: 'Edit deliverable' });

      const titleField = await screen.findByRole('textbox', { name: 'Title' });
      await waitFor(() => {
        expect(titleField).toHaveValue('API redesign');
      });
      fireEvent.change(titleField, { target: { value: 'API redesign v2' } });
      await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Deliverables' })).toBeInTheDocument();
        expect(screen.getByText('API redesign v2')).toBeInTheDocument();
      });
    },
    15000,
  );
});
