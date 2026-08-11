import { describe, expect, it, vi } from 'vitest';
import type { GithubApiClient } from '../../src/services/githubApiClient.js';
import {
  runGithubPrImport,
  type GithubPrImportDeps,
} from '../../src/services/githubPrImportService.js';
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
    upsertControl: vi.fn().mockResolvedValue({}),
    upsertPullRequestBundle: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('US2 collection control (018 regression under natural key)', () => {
  it('always refreshes on re-import and audits by PR natural key', async () => {
    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
    const upsertControl = vi.fn().mockResolvedValue({});
    const deps = baseDeps({
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
      upsertControl,
      upsertPullRequestBundle,
    });

    const first = await runGithubPrImport({ startDate: '2026-08-09', endDate: '2026-08-09' }, deps);
    const second = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      deps,
    );

    expect(first.pullRequestsImported).toBe(1);
    expect(second.pullRequestsImported).toBe(1);
    expect(second.skipped).toBe(0);
    expect(upsertPullRequestBundle).toHaveBeenCalledTimes(2);
    expect(upsertControl).toHaveBeenCalledWith(
      { repositoryId: '500', githubPullRequestId: '1001' },
      'success',
      null,
    );
  });

  it('records search failures in the run summary without control rows', async () => {
    const upsertControl = vi.fn().mockResolvedValue({});
    const failingDeps = baseDeps({
      apiClient: {
        searchMergedPullRequests: vi
          .fn()
          .mockRejectedValue(new Error('token ghp_secret123 failed')),
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
    expect(failed.failures[0].error).toContain('[redacted]');
    expect(upsertControl).not.toHaveBeenCalled();
  });

  it('records success for empty collections without control upsert', async () => {
    const upsertControl = vi.fn().mockResolvedValue({});
    const summary = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      baseDeps({ upsertControl }),
    );
    expect(summary.succeeded).toBe(1);
    expect(summary.pullRequestsImported).toBe(0);
    expect(upsertControl).not.toHaveBeenCalled();
  });
});
