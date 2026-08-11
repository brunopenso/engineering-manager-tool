import { describe, expect, it, vi } from 'vitest';
import type { GithubApiClient } from '../../src/services/githubApiClient.js';
import {
  runGithubPrImport,
  type GithubPrImportDeps,
} from '../../src/services/githubPrImportService.js';
import { samplePullRequestDetails } from '../018-github-pr-import/github-pr-import.setup.js';

function baseDeps(overrides: Partial<GithubPrImportDeps> = {}): GithubPrImportDeps {
  const apiClient: GithubApiClient = {
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
  };
  return {
    apiClient,
    listUsersWithGithubLogin: async () => [{ id: 'u1', githubLogin: 'alice-dev' }],
    listEnabledOrganizations: async () => ['acme'],
    upsertControl: vi.fn().mockResolvedValue({}),
    upsertPullRequestBundle: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('US3 collection control audit', () => {
  it('always refreshes and updates PR-keyed control even after prior success', async () => {
    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
    const upsertControl = vi.fn().mockResolvedValue({});
    const deps = baseDeps({ upsertPullRequestBundle, upsertControl });

    await runGithubPrImport({ startDate: '2026-08-09', endDate: '2026-08-09' }, deps);
    await runGithubPrImport({ startDate: '2026-08-09', endDate: '2026-08-09' }, deps);

    expect(upsertPullRequestBundle).toHaveBeenCalledTimes(2);
    expect(upsertControl).toHaveBeenCalledTimes(2);
    expect(upsertControl).toHaveBeenCalledWith(
      { repositoryId: '500', githubPullRequestId: '1001' },
      'success',
      null,
    );
  });

  it('records failed control for known PR natural key and still refreshes later', async () => {
    const upsertControl = vi.fn().mockResolvedValue({});
    const failing = baseDeps({
      upsertControl,
      upsertPullRequestBundle: vi.fn().mockRejectedValue(new Error('persist failed')),
    });

    const failed = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      failing,
    );
    expect(failed.failed).toBe(1);
    expect(upsertControl).toHaveBeenCalledWith(
      { repositoryId: '500', githubPullRequestId: '1001' },
      'failed',
      expect.stringContaining('persist failed'),
    );

    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
    const retryControl = vi.fn().mockResolvedValue({});
    const retry = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      baseDeps({ upsertPullRequestBundle, upsertControl: retryControl }),
    );
    expect(retry.pullRequestsImported).toBe(1);
    expect(retryControl).toHaveBeenCalledWith(
      { repositoryId: '500', githubPullRequestId: '1001' },
      'success',
      null,
    );
  });

  it('does not create collection-control rows for search-level failures', async () => {
    const upsertControl = vi.fn().mockResolvedValue({});
    const summary = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      baseDeps({
        upsertControl,
        apiClient: {
          searchMergedPullRequests: vi
            .fn()
            .mockRejectedValue(new Error('token ghp_secret123 failed')),
          getPullRequest: vi.fn(),
          listIssueComments: vi.fn().mockResolvedValue([]),
          listReviews: vi.fn().mockResolvedValue([]),
        },
      }),
    );

    expect(summary.failed).toBe(1);
    expect(summary.failures[0].error).toContain('[redacted]');
    expect(upsertControl).not.toHaveBeenCalled();
  });

  it('does not call control on empty successful search', async () => {
    const upsertControl = vi.fn().mockResolvedValue({});
    const summary = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      baseDeps({
        upsertControl,
        apiClient: {
          searchMergedPullRequests: vi.fn().mockResolvedValue([]),
          getPullRequest: vi.fn(),
          listIssueComments: vi.fn().mockResolvedValue([]),
          listReviews: vi.fn().mockResolvedValue([]),
        },
      }),
    );
    expect(summary.succeeded).toBe(1);
    expect(summary.pullRequestsImported).toBe(0);
    expect(upsertControl).not.toHaveBeenCalled();
  });
});
