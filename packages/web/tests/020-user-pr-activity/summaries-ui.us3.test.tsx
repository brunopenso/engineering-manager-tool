import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { MY_PULL_REQUESTS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { sampleActivityPr } from './fixtures.js';

const userWithGithub = { ...testUser, githubLogin: 'alice-dev' };

describe('US3 summary widgets UI', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders comment and review counts for the actor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          pullRequests: [
            sampleActivityPr({
              comments: [
                {
                  id: 'c1',
                  githubCommentId: '1',
                  authorGithubLogin: 'alice-dev',
                  body: 'note',
                  createdAt: '2026-08-01T13:00:00.000Z',
                  updatedAt: '2026-08-01T13:00:00.000Z',
                  url: null,
                },
                {
                  id: 'c2',
                  githubCommentId: '2',
                  authorGithubLogin: 'alice-dev',
                  body: 'again',
                  createdAt: '2026-08-01T14:00:00.000Z',
                  updatedAt: '2026-08-01T14:00:00.000Z',
                  url: null,
                },
              ],
              reviews: [
                {
                  id: 'r1',
                  githubReviewId: '1',
                  reviewerGithubLogin: 'alice-dev',
                  body: null,
                  state: 'APPROVED',
                  createdAt: '2026-08-01T15:00:00.000Z',
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

    await waitFor(() => {
      expect(screen.getByTestId('comment-count')).toHaveTextContent('2');
    });
    expect(screen.getByTestId('review-count')).toHaveTextContent('1');
    expect(screen.getByTestId('authored-prs-chart')).toBeInTheDocument();
  });
});
