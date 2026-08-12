import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { MY_PULL_REQUESTS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { sampleActivityPr } from '../020-user-pr-activity/fixtures.js';

const userWithGithub = { ...testUser, githubLogin: 'alice-dev' };

describe('021 create deliverable selection edges', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays disabled on empty activity and after deselect-all; analyze uses selection snapshot', async () => {
    const user = userEvent.setup();
    let analyzedIds: string[] | null = null;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/github-pull-requests/my-activity')) {
        return {
          ok: true,
          json: async () => ({
            pullRequests: [
              sampleActivityPr({ id: 'pr-a', title: 'PR A' }),
              sampleActivityPr({ id: 'pr-b', title: 'PR B' }),
            ],
          }),
        };
      }
      if (url.includes('/deliverables/from-pull-requests/analyze')) {
        const body = JSON.parse(String(init?.body)) as { pullRequestIds: string[] };
        analyzedIds = body.pullRequestIds;
        return {
          ok: true,
          json: async () => ({
            sourcePullRequestIds: body.pullRequestIds,
            proposal: {
              title: 'Proposal',
              description: 'Desc',
              roleInDeliverable: 'Author',
              businessImpact: 'MEDIUM',
              improvementPoints: 'Points',
              systemTagIds: [],
            },
          }),
        };
      }
      return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'unexpected' }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: MY_PULL_REQUESTS_ROUTE,
      isAuthenticated: true,
      user: userWithGithub,
    });

    expect(await screen.findByText('PR A')).toBeInTheDocument();
    const createButton = screen.getByTestId('create-deliverable-button');
    expect(createButton).toBeDisabled();

    await user.click(within(screen.getByTestId('pr-select-pr-a')).getByRole('checkbox'));
    expect(createButton).toBeEnabled();
    await user.click(within(screen.getByTestId('pr-select-pr-a')).getByRole('checkbox'));
    expect(createButton).toBeDisabled();

    await user.click(within(screen.getByTestId('pr-select-pr-a')).getByRole('checkbox'));
    await user.click(within(screen.getByTestId('pr-select-pr-b')).getByRole('checkbox'));
    await user.click(createButton);

    await waitFor(() => {
      expect(analyzedIds).toEqual(['pr-a', 'pr-b']);
    });
  });
});
