import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

async function selectTeamMember(name: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Team member' }));
  const listbox = await screen.findByRole('listbox');
  await userEvent.click(within(listbox).getByRole('option', { name }));
}

describe('US2 team deliverables date filter', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('searches again when date range changes for selected member', async () => {
    const searchCalls: string[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/users/leader/team-members')) {
        return {
          ok: true,
          json: async () => ({
            members: [{ id: 'report-1', displayName: 'Alice Report' }],
          }),
        };
      }

      if (url.includes('/users/leader/team-deliverables')) {
        searchCalls.push(url);
        return {
          ok: true,
          json: async () => ({
            ownerUserId: 'report-1',
            deliverables:
              searchCalls.length >= 2
                ? []
                : [
                    {
                      id: 'del-1',
                      title: 'Recent work',
                      description: 'Details',
                      reviewed: false,
                    },
                  ],
          }),
        };
      }

      return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/leader/team-deliverables',
      isAuthenticated: true,
      user: testLeaderUser,
    });

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Team member' })).toBeInTheDocument();
    });

    await selectTeamMember('Alice Report');

    await waitFor(() => {
      expect(screen.getByText('Recent work')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('start-date-input'), {
      target: { value: '2026-01-01' },
    });

    await waitFor(() => {
      expect(searchCalls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
