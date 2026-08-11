import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { defaultLast60DayRange } from '../../src/services/myPullRequestsApi.js';
import {
  getVisibleShellMenuOptions,
  MY_PULL_REQUESTS_ROUTE,
} from '../../src/routes/shellOptions.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { sampleActivityPr } from './fixtures.js';

const userWithGithub = { ...testUser, githubLogin: 'alice-dev' };

describe('US1 my pull requests screen access', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows My Pull Requests in the base menu for authenticated collaborators', () => {
    const options = getVisibleShellMenuOptions(testUser);
    expect(options.some((option) => option.route === MY_PULL_REQUESTS_ROUTE)).toBe(true);
    expect(options.some((option) => option.label === 'My Pull Requests')).toBe(true);
  });

  it('shows GitHub guidance when user has no github login', async () => {
    renderWithProviders(<App />, {
      initialPath: MY_PULL_REQUESTS_ROUTE,
      isAuthenticated: true,
      user: testUser,
    });

    expect(await screen.findByTestId('pr-activity-no-github')).toBeInTheDocument();
    expect(screen.queryByTestId('pr-activity-start-date')).not.toBeInTheDocument();
  });

  it('loads activity with default 60-day range when github login is present', async () => {
    const defaultRange = defaultLast60DayRange();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/github-pull-requests/my-activity') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ pullRequests: [sampleActivityPr()] }),
        };
      }
      return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected' }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: MY_PULL_REQUESTS_ROUTE,
      isAuthenticated: true,
      user: userWithGithub,
    });

    expect(await screen.findByRole('heading', { name: 'My Pull Requests' })).toBeInTheDocument();
    expect(screen.getByTestId('pr-activity-start-date')).toHaveValue(defaultRange.startDate);
    expect(screen.getByTestId('pr-activity-end-date')).toHaveValue(defaultRange.endDate);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const body = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body));
    expect(body).toEqual({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
    });
  });

  it('redirects unauthenticated users away from the route', async () => {
    renderWithProviders(<App />, {
      initialPath: MY_PULL_REQUESTS_ROUTE,
      isAuthenticated: false,
    });

    expect(await screen.findByText(/sign in with google to access/i)).toBeInTheDocument();
  });
});
