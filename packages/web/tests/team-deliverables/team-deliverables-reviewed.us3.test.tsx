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

describe('US3 team deliverables reviewed toggle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('optimistically toggles reviewed and rolls back on failure', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/users/leader/team-members')) {
        return {
          ok: true,
          json: async () => ({
            members: [{ id: 'report-1', displayName: 'Alice Report' }],
          }),
        };
      }

      if (url.includes('/users/leader/team-deliverables')) {
        return {
          ok: true,
          json: async () => ({
            ownerUserId: 'report-1',
            deliverables: [
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

      if (url.includes('/deliverables/del-1/reviewed') && init?.method === 'PUT') {
        return {
          ok: false,
          json: async () => ({
            code: 'FORBIDDEN',
            message: 'Unable to update reviewed status.',
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

    const checkbox = screen.getByRole('checkbox', { name: /mark recent work as reviewed/i });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
      expect(screen.getByText(/unable to update reviewed status/i)).toBeInTheDocument();
    });
  });
});
