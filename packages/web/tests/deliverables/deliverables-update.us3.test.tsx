import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

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
        businessImpact: 'HIGH' as const,
        systemTags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      };

      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init?: RequestInit) => {
          if (url.includes('/tags/catalog')) {
            return {
              ok: true,
              json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
            };
          }

          if (url.includes('/deliverables/del-1') && init?.method === 'PATCH') {
            return {
              ok: true,
              json: async () => ({
                deliverable: { ...summary, title: 'API redesign v2' },
              }),
            };
          }

          if (url.includes('/deliverables/del-1')) {
            return {
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
                },
              }),
            };
          }

          if (url.includes('/deliverables?')) {
            return {
              ok: true,
              json: async () => ({
                deliverables: [{ ...summary, title: 'API redesign v2' }],
                hasAnyDeliverables: true,
              }),
            };
          }

          return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
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
