import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { MY_PULL_REQUESTS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { sampleActivityPr } from './fixtures.js';

const userWithGithub = { ...testUser, githubLogin: 'alice-dev' };

describe('PR reclassification UI', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps Change Classification visible, enables after selecting rows, and saves via modal', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/github-pull-requests/my-activity')) {
        return {
          ok: true,
          json: async () => ({
            pullRequests: [
              sampleActivityPr({
                id: 'pr-a',
                title: 'PR A',
                classificationType: 'feature',
                userReclassification: 'feature',
              }),
              sampleActivityPr({
                id: 'pr-b',
                title: 'PR B',
                classificationType: 'fix',
                userReclassification: 'fix',
              }),
            ],
          }),
        };
      }
      if (url.includes('/github-pull-requests/classification-types')) {
        return {
          ok: true,
          json: async () => ({
            types: ['feature', 'fix', 'documentation', 'maintenance'],
          }),
        };
      }
      if (url.includes('/github-pull-requests/reclassify')) {
        expect(init?.method).toBe('PATCH');
        const body = JSON.parse(String(init?.body)) as {
          pullRequestIds: string[];
          classification: string;
        };
        expect(body.pullRequestIds).toEqual(['pr-a']);
        expect(body.classification).toBe('documentation');
        return {
          ok: true,
          json: async () => ({
            updatedCount: 1,
            pullRequests: [
              {
                id: 'pr-a',
                userReclassification: 'documentation',
              },
            ],
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
    expect(screen.getByTestId('change-classification-button')).toBeDisabled();

    await user.click(within(screen.getByTestId('pr-select-pr-a')).getByRole('checkbox'));
    expect(screen.getByTestId('change-classification-button')).toBeEnabled();

    await user.click(screen.getByTestId('change-classification-button'));
    expect(await screen.findByTestId('change-classification-modal')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('reclassify-type-select')).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByLabelText('New classification'));
    await user.click(await screen.findByRole('option', { name: 'Documentation' }));
    await user.click(screen.getByTestId('reclassify-confirm'));

    await waitFor(() => {
      expect(screen.queryByTestId('change-classification-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('pr-classification-pr-a')).toHaveTextContent('Documentation');
    expect(screen.getByTestId('change-classification-button')).toBeDisabled();
  });

  it('displays userReclassification over classificationType', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          pullRequests: [
            sampleActivityPr({
              id: 'pr-override',
              title: 'Override PR',
              classificationType: 'feature',
              userReclassification: 'maintenance',
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

    expect(await screen.findByText('Override PR')).toBeInTheDocument();
    expect(screen.getByTestId('pr-classification-pr-override')).toHaveTextContent('Maintenance');
  });
});
