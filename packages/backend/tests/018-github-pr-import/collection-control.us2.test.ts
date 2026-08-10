import { describe, expect, it, vi } from 'vitest';
import type { GithubApiClient } from '../../src/services/githubApiClient.js';
import { runGithubPrImport, type GithubPrImportDeps } from '../../src/services/githubPrImportService.js';
import { shouldSkipSuccessfulCollection } from '../../src/services/githubPrCollectionControlService.js';
import type { GithubPrCollectionControl } from '../../src/database/entities/GithubPrCollectionControl.js';
import { samplePullRequestDetails } from './github-pr-import.setup.js';

function baseDeps(overrides: Partial<GithubPrImportDeps> = {}): GithubPrImportDeps {
  const apiClient: GithubApiClient = {
    searchMergedPullRequests: vi.fn().mockResolvedValue([]),
    getPullRequest: vi.fn(),
    listIssueComments: vi.fn().mockResolvedValue([]),
    listReviews: vi.fn().mockResolvedValue([]),
  };
  return {
    apiClient,
    listUsersWithGithubLogin: async () => [{ id: 'u1', githubLogin: 'alice-dev' }],
    listEnabledOrganizations: async () => ['acme'],
    findControl: async () => null,
    upsertControl: vi.fn().mockResolvedValue({}),
    upsertPullRequestBundle: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('US2 collection control', () => {
  it('detects successful collections for skip', () => {
    expect(
      shouldSkipSuccessfulCollection({ status: 'success' } as GithubPrCollectionControl),
    ).toBe(true);
    expect(
      shouldSkipSuccessfulCollection({ status: 'failed' } as GithubPrCollectionControl),
    ).toBe(false);
    expect(shouldSkipSuccessfulCollection(null)).toBe(false);
  });

  it('skips re-import when prior success exists without importing PRs', async () => {
    const upsertPullRequestBundle = vi.fn();
    const upsertControl = vi.fn().mockResolvedValue({});
    const search = vi.fn();
    const deps = baseDeps({
      apiClient: {
        searchMergedPullRequests: search,
        getPullRequest: vi.fn(),
        listIssueComments: vi.fn().mockResolvedValue([]),
        listReviews: vi.fn().mockResolvedValue([]),
      },
      findControl: async () =>
        ({
          status: 'success',
          collaboratorId: 'u1',
          organization: 'acme',
          startDate: '2026-08-09',
          endDate: '2026-08-09',
        }) as GithubPrCollectionControl,
      upsertControl,
      upsertPullRequestBundle,
    });

    const summary = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      deps,
    );

    expect(summary.skipped).toBe(1);
    expect(search).not.toHaveBeenCalled();
    expect(upsertPullRequestBundle).not.toHaveBeenCalled();
    expect(upsertControl).not.toHaveBeenCalled();
  });

  it('records failed control with sanitized error and allows later success', async () => {
    const upsertControl = vi.fn().mockResolvedValue({});
    const failingDeps = baseDeps({
      apiClient: {
        searchMergedPullRequests: vi.fn().mockRejectedValue(new Error('token ghp_secret123 failed')),
        getPullRequest: vi.fn(),
        listIssueComments: vi.fn().mockResolvedValue([]),
        listReviews: vi.fn().mockResolvedValue([]),
      },
      upsertControl,
    });

    const failed = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      failingDeps,
    );
    expect(failed.failed).toBe(1);
    expect(upsertControl).toHaveBeenCalledWith(
      expect.any(Object),
      'failed',
      expect.stringContaining('[redacted]'),
    );

    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
    const retryDeps = baseDeps({
      apiClient: {
        searchMergedPullRequests: vi.fn().mockResolvedValue([
          {
            organization: 'acme',
            repository: 'widgets',
            repositoryId: '500',
            number: 42,
            githubPullRequestId: '1001',
          },
        ]),
        getPullRequest: vi.fn().mockResolvedValue(samplePullRequestDetails()),
        listIssueComments: vi.fn().mockResolvedValue([]),
        listReviews: vi.fn().mockResolvedValue([]),
      },
      findControl: async () =>
        ({
          status: 'failed',
          errorDetails: 'previous',
        }) as GithubPrCollectionControl,
      upsertControl: vi.fn().mockResolvedValue({}),
      upsertPullRequestBundle,
    });

    const retry = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      retryDeps,
    );
    expect(retry.succeeded).toBe(1);
    expect(retry.pullRequestsImported).toBe(1);
    expect(upsertPullRequestBundle).toHaveBeenCalledTimes(1);
  });

  it('records success for empty collections', async () => {
    const upsertControl = vi.fn().mockResolvedValue({});
    const summary = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      baseDeps({ upsertControl }),
    );
    expect(summary.succeeded).toBe(1);
    expect(summary.pullRequestsImported).toBe(0);
    expect(upsertControl).toHaveBeenCalledWith(expect.any(Object), 'success', null);
  });
});
