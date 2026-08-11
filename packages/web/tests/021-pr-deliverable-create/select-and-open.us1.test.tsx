import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { MY_PULL_REQUESTS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { sampleActivityPr } from '../020-user-pr-activity/fixtures.js';

const userWithGithub = { ...testUser, githubLogin: 'alice-dev' };

describe('021 create deliverable select-and-open', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps Create deliverable disabled until a row is selected, then opens loading modal', async () => {
    const user = userEvent.setup();
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
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          ok: true,
          json: async () => ({
            sourcePullRequestIds: ['pr-a'],
            proposal: {
              title: 'PR A',
              description: 'Proposed',
              roleInDeliverable: 'Author',
              businessImpact: 'MEDIUM',
              improvementPoints: 'Improve',
              systemTagIds: [],
            },
          }),
        };
      }
      void init;
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

    await user.click(createButton);
    expect(await screen.findByTestId('create-deliverable-loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([request]) =>
          String(request).includes('/deliverables/from-pull-requests/analyze'),
        ),
      ).toBe(true);
    });
  });
});
