import { screen, within } from '@testing-library/react';
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
  businessImpact: 'MEDIUM' as const,
  improvementPoints: 'Improve tests',
  systemTagIds: [] as string[],
  technicalDescription: null,
  userTags: ['widgets'],
  links: [{ url: 'https://github.com/acme/widgets/pull/42', label: '#42 PR A' }],
};

describe('021 create deliverable confirm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('confirms create, shows complement link, and clears selection', async () => {
    const user = userEvent.setup();
    let createCount = 0;
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
        createCount += 1;
        const body = JSON.parse(String(init.body)) as typeof proposal;
        expect(body.title).toBe(proposal.title);
        expect(body.businessImpact).toBe('MEDIUM');
        return {
          ok: true,
          json: async () => ({
            deliverable: {
              id: 'del-1',
              ownerUserId: 'u1',
              title: proposal.title,
              businessImpact: proposal.businessImpact,
              systemTags: [],
              description: proposal.description,
              roleInDeliverable: proposal.roleInDeliverable,
              improvementPoints: proposal.improvementPoints,
              technicalDescription: null,
              userTags: [],
              links: [],
              createdAt: '2026-08-11T00:00:00.000Z',
              updatedAt: '2026-08-11T00:00:00.000Z',
            },
          }),
        };
      }
      if (url.includes('/tags/catalog')) {
        return { ok: true, json: async () => ({ tags: [] }) };
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
    expect(await screen.findByTestId('create-deliverable-confirm')).toBeInTheDocument();
    await user.click(screen.getByTestId('create-deliverable-confirm'));
    expect(await screen.findByTestId('create-deliverable-success')).toBeInTheDocument();
    expect(createCount).toBe(1);

    const complement = screen.getByTestId('create-deliverable-complement-link');
    expect(complement).toHaveAttribute('href', '/app/deliverables/del-1/edit');
    expect(screen.getByTestId('create-deliverable-button')).toBeDisabled();
  });

  it('shows error when create fails and does not show success link', async () => {
    const user = userEvent.setup();
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
        return {
          ok: false,
          status: 400,
          json: async () => ({ code: 'VALIDATION_ERROR', message: 'Invalid deliverable' }),
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
    await user.click(await screen.findByTestId('create-deliverable-confirm'));
    expect(await screen.findByTestId('create-deliverable-error')).toBeInTheDocument();
    expect(screen.queryByTestId('create-deliverable-complement-link')).not.toBeInTheDocument();
  });
});
