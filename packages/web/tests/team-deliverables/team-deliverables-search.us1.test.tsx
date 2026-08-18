import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';
import { defaultLast30DayRange } from '../../src/services/teamDeliverablesApi.js';

describe('US1 leader team deliverables page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders team select, default dates, and empty state until selection', async () => {
    const defaultRange = defaultLast30DayRange();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        manager: null,
        self: {
          id: 'leader-1',
          displayName: 'Team Leader',
          email: 'leader@example.com',
          isLeader: true,
        },
        reports: [
          {
            id: 'report-1',
            displayName: 'Alice Report',
            email: 'alice@example.com',
            isLeader: false,
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: '/app/leader/team-deliverables',
      isAuthenticated: true,
      user: testLeaderUser,
    });

    await waitFor(() => {
      expect(screen.getByText('Team Deliverables')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Team member')).toBeInTheDocument();
    expect(screen.getByTestId('team-member-select')).toHaveValue('');
    expect(screen.getByTestId('start-date-input')).toHaveValue(defaultRange.startDate);
    expect(screen.getByTestId('end-date-input')).toHaveValue(defaultRange.endDate);
    expect(screen.getByTestId('reviewed-filter')).toHaveTextContent('Not reviewed');
    expect(screen.getByText(/select a team member to search deliverables/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/leader/hierarchy-view'),
      expect.any(Object),
    );
  });

  it('opens a compact hierarchy popover and selects a nested collaborator', async () => {
    const searchCalls: string[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/users/leader/hierarchy-view')) {
        return {
          ok: true,
          json: async () => ({
            manager: null,
            self: {
              id: 'leader-1',
              displayName: 'Team Leader',
              email: 'leader@example.com',
              isLeader: true,
            },
            reports: [
              {
                id: 'report-1',
                displayName: 'Alice Lead',
                email: 'alice@example.com',
                isLeader: true,
                children: [
                  {
                    id: 'report-2',
                    displayName: 'Bob Nested',
                    email: 'bob@example.com',
                    isLeader: false,
                  },
                ],
              },
            ],
          }),
        };
      }

      if (url.includes('/users/leader/team-deliverables')) {
        searchCalls.push(url);
        return {
          ok: true,
          json: async () => ({ ownerUserId: 'report-2', deliverables: [] }),
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

    await userEvent.click(await screen.findByTestId('team-member-select'));

    expect(
      screen.getByRole('button', { name: 'Select Alice Lead and their team' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Select Bob Nested itself only' }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Expand Alice Lead' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Select Bob Nested itself only' }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('team-member-select')).toHaveValue('Bob Nested (itself)');
      expect(searchCalls[0]).toContain('userId=report-2');
      expect(searchCalls[0]).toContain('scope=itself');
    });
  });
});
