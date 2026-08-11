import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { MY_PULL_REQUESTS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { sampleActivityPr } from './fixtures.js';

const userWithGithub = { ...testUser, githubLogin: 'alice-dev' };

describe('US2 my pull requests filters', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('filters table by repository and shows empty state when none match', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        pullRequests: [
          sampleActivityPr({ id: 'pr-w', repository: 'widgets', title: 'Widgets PR' }),
          sampleActivityPr({
            id: 'pr-t',
            repository: 'tools',
            title: 'Tools PR',
            involvementRole: 'involved',
            authorGithubLogin: 'bob',
          }),
        ],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: MY_PULL_REQUESTS_ROUTE,
      isAuthenticated: true,
      user: userWithGithub,
    });

    expect(await screen.findByText('Widgets PR')).toBeInTheDocument();
    expect(screen.getByText('Tools PR')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Repository'));
    await user.click(await screen.findByRole('option', { name: 'acme/tools' }));
    // Draft filter does not apply until Search
    expect(screen.getByText('Widgets PR')).toBeInTheDocument();

    await user.click(screen.getByTestId('pr-activity-search'));

    await waitFor(() => {
      expect(screen.queryByText('Widgets PR')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Tools PR')).toBeInTheDocument();
  });

  it('shows date validation when searching with end before start', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ pullRequests: [sampleActivityPr()] }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<App />, {
      initialPath: MY_PULL_REQUESTS_ROUTE,
      isAuthenticated: true,
      user: userWithGithub,
    });

    expect(await screen.findByTestId('pr-activity-start-date')).toBeInTheDocument();
    const initialCalls = fetchMock.mock.calls.length;

    await user.clear(screen.getByTestId('pr-activity-start-date'));
    await user.type(screen.getByTestId('pr-activity-start-date'), '2026-08-20');
    await user.clear(screen.getByTestId('pr-activity-end-date'));
    await user.type(screen.getByTestId('pr-activity-end-date'), '2026-08-01');

    expect(screen.queryByTestId('pr-activity-date-error')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('pr-activity-search'));

    expect(await screen.findByTestId('pr-activity-date-error')).toBeInTheDocument();
    expect(fetchMock.mock.calls.length).toBe(initialCalls);
  });
});
