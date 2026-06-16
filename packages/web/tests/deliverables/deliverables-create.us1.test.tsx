import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';

describe('US1 deliverable creation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(
    'submits create form and refreshes list',
    async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init?: RequestInit) => {
          if (url.includes('/tags/catalog')) {
            return {
              ok: true,
              json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
            };
          }

          if (url.includes('/deliverables') && init?.method === 'POST') {
            return {
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
            };
          }

          if (url.includes('/deliverables?')) {
            return {
              ok: true,
              json: async () => ({
                deliverables: [
                  {
                    id: 'del-1',
                    ownerUserId: 'user-1',
                    title: 'API redesign',
                    businessImpact: 'HIGH',
                    systemTags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }],
                    createdAt: '2026-05-26T00:00:00.000Z',
                    updatedAt: '2026-05-26T00:00:00.000Z',
                  },
                ],
                hasAnyDeliverables: true,
              }),
            };
          }

          return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
        }),
      );

      renderWithProviders(<App />, {
        initialPath: '/app/deliverables/new',
        isAuthenticated: true,
      });

      await screen.findByRole('heading', { name: 'Add deliverable' });
      await screen.findByRole('textbox', { name: 'Title' });

      fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
        target: { value: 'API redesign' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
        target: { value: 'Shipped new API' },
      });
      fireEvent.change(
        screen.getByRole('textbox', { name: 'Your role in this deliverable' }),
        { target: { value: 'Tech lead' } },
      );
      fireEvent.change(
        screen.getByRole('textbox', {
          name: 'Personal performance improvement points',
        }),
        { target: { value: 'Write more docs' } },
      );

      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tags' }));
      const listbox = await screen.findByRole('listbox');
      await userEvent.click(within(listbox).getByRole('option', { name: 'Platform' }));
      await userEvent.keyboard('{Escape}');
      await userEvent.click(await screen.findByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Deliverables' })).toBeInTheDocument();
        expect(screen.getByText('API redesign')).toBeInTheDocument();
      }, { timeout: 5000 });
    },
    15000,
  );

  it(
    'submits create form without system tags',
    async () => {
      let postBody: unknown;

      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init?: RequestInit) => {
          if (url.includes('/tags/catalog')) {
            return {
              ok: true,
              json: async () => ({ tags: [{ id: 'tag-1', name: 'Platform', color: '#1976D2' }] }),
            };
          }

          if (url.includes('/deliverables') && init?.method === 'POST') {
            postBody = JSON.parse(init.body as string);
            return {
              ok: true,
              json: async () => ({
                deliverable: {
                  id: 'del-2',
                  ownerUserId: 'user-1',
                  title: 'Untagged deliverable',
                  businessImpact: 'HIGH',
                  systemTags: [],
                  updatedAt: '2026-05-26T00:00:00.000Z',
                  description: 'Shipped new API',
                  roleInDeliverable: 'Tech lead',
                  improvementPoints: 'Write more docs',
                  technicalDescription: null,
                  userTags: [],
                  links: [],
                  createdAt: '2026-05-26T00:00:00.000Z',
                },
              }),
            };
          }

          if (url.includes('/deliverables?')) {
            return {
              ok: true,
              json: async () => ({
                deliverables: [
                  {
                    id: 'del-2',
                    ownerUserId: 'user-1',
                    title: 'Untagged deliverable',
                    businessImpact: 'HIGH',
                    systemTags: [],
                    createdAt: '2026-05-26T00:00:00.000Z',
                    updatedAt: '2026-05-26T00:00:00.000Z',
                  },
                ],
                hasAnyDeliverables: true,
              }),
            };
          }

          return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
        }),
      );

      renderWithProviders(<App />, {
        initialPath: '/app/deliverables/new',
        isAuthenticated: true,
      });

      await screen.findByRole('heading', { name: 'Add deliverable' });
      await screen.findByRole('textbox', { name: 'Title' });

      fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
        target: { value: 'Untagged deliverable' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
        target: { value: 'Shipped new API' },
      });
      fireEvent.change(
        screen.getByRole('textbox', { name: 'Your role in this deliverable' }),
        { target: { value: 'Tech lead' } },
      );
      fireEvent.change(
        screen.getByRole('textbox', {
          name: 'Personal performance improvement points',
        }),
        { target: { value: 'Write more docs' } },
      );

      await userEvent.click(await screen.findByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Deliverables' })).toBeInTheDocument();
        expect(screen.getByText('Untagged deliverable')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(postBody).toMatchObject({ systemTagIds: [] });
    },
    15000,
  );
});
