import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { MY_PULL_REQUESTS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { sampleActivityPr } from './fixtures.js';

const userWithGithub = { ...testUser, githubLogin: 'alice-dev' };

describe('US4 table and detail modal', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('labels owner vs involved and opens detail modal on row click', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          pullRequests: [
            sampleActivityPr({
              id: 'owned',
              title: 'Owned PR',
              involvementRole: 'owner',
              mergedAt: '2026-08-10T00:00:00.000Z',
            }),
            sampleActivityPr({
              id: 'involved',
              title: 'Reviewed PR',
              involvementRole: 'involved',
              authorGithubLogin: 'bob',
              mergedAt: '2026-08-09T00:00:00.000Z',
              reviews: [
                {
                  id: 'r1',
                  githubReviewId: '1',
                  reviewerGithubLogin: 'alice-dev',
                  body: 'Looks good',
                  state: 'APPROVED',
                  createdAt: '2026-08-09T12:00:00.000Z',
                  updatedAt: null,
                  url: null,
                },
              ],
            }),
          ],
        }),
      })),
    );

    renderWithProviders(<App />, {
      initialPath: MY_PULL_REQUESTS_ROUTE,
      isAuthenticated: true,
      user: userWithGithub,
    });

    expect(await screen.findByText('Owned PR')).toBeInTheDocument();
    expect(screen.getByText('Reviewed PR')).toBeInTheDocument();
    expect(screen.getAllByText('Owner').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Involved').length).toBeGreaterThan(0);

    expect(screen.getByTestId('pr-row-owned')).toBeInTheDocument();

    await user.click(screen.getByTestId('pr-row-involved'));
    expect(await screen.findByTestId('pr-detail-modal')).toBeInTheDocument();
    expect(screen.getByText('Looks good')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('Looks good')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('pr-activity-start-date')).toBeInTheDocument();
    expect(screen.getByTestId('pr-row-owned')).toBeInTheDocument();
  });

  it('shows empty table messaging when no PRs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ pullRequests: [] }),
      })),
    );

    renderWithProviders(<App />, {
      initialPath: MY_PULL_REQUESTS_ROUTE,
      isAuthenticated: true,
      user: userWithGithub,
    });

    expect(await screen.findByTestId('pr-activity-empty')).toBeInTheDocument();
    expect(screen.getByText('No pull requests to display')).toBeInTheDocument();
  });
});
