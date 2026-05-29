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

describe('US3 team deliverables reviewed filter and review modal', { timeout: 15000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to not reviewed filter and opens deliverable details modal', async () => {
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
        return {
          ok: true,
          json: async () => ({
            ownerUserId: 'report-1',
            deliverables: [
              {
                id: 'del-1',
                title: 'Pending work',
                description: 'Needs review',
                reviewed: false,
              },
              {
                id: 'del-2',
                title: 'Completed work',
                description: 'Already reviewed',
                reviewed: true,
              },
            ],
          }),
        };
      }

      if (url.includes('/deliverables/del-1')) {
        return {
          ok: true,
          json: async () => ({
            readOnly: true,
            deliverable: {
              id: 'del-1',
              ownerUserId: 'report-1',
              title: 'Pending work',
              description: 'Needs review',
              roleInDeliverable: 'Lead engineer',
              businessImpact: 'HIGH',
              improvementPoints: 'Improve testing',
              technicalDescription: 'Built the API',
              systemTags: [{ id: 'tag-1', name: 'Platform', color: '#336699' }],
              userTags: ['backend'],
              links: [{ url: 'https://example.com', label: 'Demo' }],
              createdAt: '2026-05-01T10:00:00.000Z',
              updatedAt: '2026-05-10T10:00:00.000Z',
            },
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

    expect(screen.getByTestId('reviewed-filter')).toHaveTextContent('Not reviewed');

    await selectTeamMember('Alice Report');

    await waitFor(() => {
      expect(screen.getByText('Pending work')).toBeInTheDocument();
    });

    expect(screen.queryByText('Completed work')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /review pending work/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Review deliverable' })).toBeInTheDocument();
    });

    expect(screen.getByText('Lead engineer')).toBeInTheDocument();
    expect(screen.getByText('Improve testing')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));

    expect(
      screen.getByText(/additional review notes will be available here in a future update/i),
    ).toBeInTheDocument();
  });

  it('shows reviewed deliverables when filter changes', async () => {
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
        return {
          ok: true,
          json: async () => ({
            ownerUserId: 'report-1',
            deliverables: [
              {
                id: 'del-1',
                title: 'Pending work',
                description: 'Needs review',
                reviewed: false,
              },
              {
                id: 'del-2',
                title: 'Completed work',
                description: 'Already reviewed',
                reviewed: true,
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
      expect(screen.getByText('Pending work')).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Review status' }));
    const listbox = await screen.findByRole('listbox');
    await userEvent.click(within(listbox).getByRole('option', { name: 'Reviewed' }));

    await waitFor(() => {
      expect(screen.getByText('Completed work')).toBeInTheDocument();
    });

    expect(screen.queryByText('Pending work')).not.toBeInTheDocument();
  });
});
