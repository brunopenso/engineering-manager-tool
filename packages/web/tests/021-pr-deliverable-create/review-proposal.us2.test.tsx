import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.js';
import { MY_PULL_REQUESTS_ROUTE } from '../../src/routes/shellOptions.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { sampleActivityPr } from '../020-user-pr-activity/fixtures.js';

const userWithGithub = { ...testUser, githubLogin: 'alice-dev' };

const proposal = {
  title: 'PR A proposal',
  description: 'Proposed description',
  roleInDeliverable: 'Author',
  businessImpact: 'MEDIUM',
  improvementPoints: 'Improve tests',
  systemTagIds: [] as string[],
};

describe('021 create deliverable review', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows proposal after analyze and cancel does not create', async () => {
    const user = userEvent.setup();
    let createCalled = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/github-pull-requests/my-activity')) {
        return {
          ok: true,
          json: async () => ({ pullRequests: [sampleActivityPr({ id: 'pr-a', title: 'PR A' })] }),
        };
      }
      if (url.includes('/deliverables/from-pull-requests/analyze')) {
        return {
          ok: true,
          json: async () => ({ sourcePullRequestIds: ['pr-a'], proposal }),
        };
      }
      if (url.endsWith('/deliverables') && init?.method === 'POST') {
        createCalled = true;
        return {
          ok: false,
          json: async () => ({ code: 'FORBIDDEN', message: 'should not create' }),
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
    await user.click(within(screen.getByTestId('pr-select-pr-a')).getByRole('checkbox'));
    await user.click(screen.getByTestId('create-deliverable-button'));
    expect(await screen.findByTestId('create-deliverable-review')).toBeInTheDocument();
    expect(screen.getByText('PR A proposal')).toBeInTheDocument();
    expect(screen.getByTestId('create-deliverable-confirm')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByTestId('create-deliverable-review')).not.toBeInTheDocument();
    });
    expect(createCalled).toBe(false);
  });

  it('shows error when analyze is forbidden', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/github-pull-requests/my-activity')) {
        return {
          ok: true,
          json: async () => ({ pullRequests: [sampleActivityPr({ id: 'pr-a', title: 'PR A' })] }),
        };
      }
      if (url.includes('/deliverables/from-pull-requests/analyze')) {
        return {
          ok: false,
          status: 403,
          json: async () => ({
            code: 'FORBIDDEN',
            message: 'One or more pull requests were not found or are not accessible.',
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
    await user.click(within(screen.getByTestId('pr-select-pr-a')).getByRole('checkbox'));
    await user.click(screen.getByTestId('create-deliverable-button'));
    expect(await screen.findByTestId('create-deliverable-error')).toBeInTheDocument();
    expect(screen.queryByTestId('create-deliverable-confirm')).not.toBeInTheDocument();
  });
});
