import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { MY_PULL_REQUESTS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { sampleActivityPr } from './fixtures.js';

const userWithGithub = { ...testUser, githubLogin: 'alice-dev' };

describe('US4 table roles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('orders newest mergedAt first', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          pullRequests: [
            sampleActivityPr({ id: 'old', title: 'Old PR', mergedAt: '2026-07-01T00:00:00.000Z' }),
            sampleActivityPr({ id: 'new', title: 'New PR', mergedAt: '2026-08-15T00:00:00.000Z' }),
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
      expect(screen.getByText('New PR')).toBeInTheDocument();
    });

    const bodyText = screen.getByTestId('my-pull-requests-table').textContent ?? '';
    expect(bodyText.indexOf('New PR')).toBeLessThan(bodyText.indexOf('Old PR'));
  });

  it('shows classification type and complexity columns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          pullRequests: [
            sampleActivityPr({
              id: 'pr-class',
              title: 'Classified PR',
              classificationType: 'feature',
              complexityIndex: 4,
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

    expect(await screen.findByText('Classified PR')).toBeInTheDocument();
    expect(screen.getByTestId('pr-classification-pr-class')).toHaveTextContent('Feature');
    expect(screen.getByTestId('pr-complexity-pr-class')).toHaveTextContent('4');
  });
});
