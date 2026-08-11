import { describe, expect, it, vi } from 'vitest';
import type { GithubApiClient } from '../../src/services/githubApiClient.js';
import {
  runGithubPrImport,
  type GithubPrImportDeps,
} from '../../src/services/githubPrImportService.js';

describe('US1 import user filter', () => {
  it('does not call GitHub for users lacking a github login', async () => {
    const search = vi.fn().mockResolvedValue([]);
    const apiClient: GithubApiClient = {
      searchMergedPullRequests: search,
      getPullRequest: vi.fn(),
      listIssueComments: vi.fn().mockResolvedValue([]),
      listReviews: vi.fn().mockResolvedValue([]),
    };
    const deps: GithubPrImportDeps = {
      apiClient,
      listUsersWithGithubLogin: async () => [{ id: 'u2', githubLogin: '   ' }],
      listEnabledOrganizations: async () => ['acme'],
      upsertControl: vi.fn().mockResolvedValue({}),
      upsertPullRequestBundle: vi.fn(),
    };

    const summary = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      deps,
    );

    expect(search).not.toHaveBeenCalled();
    expect(summary.processed).toBe(0);
  });
});
