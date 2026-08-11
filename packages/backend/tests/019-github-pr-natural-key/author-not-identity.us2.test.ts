import { describe, expect, it, vi } from 'vitest';
import type { GithubApiClient } from '../../src/services/githubApiClient.js';
import {
  runGithubPrImport,
  type GithubPrImportDeps,
} from '../../src/services/githubPrImportService.js';
import { samplePullRequestDetails } from '../018-github-pr-import/github-pr-import.setup.js';

describe('US2 author is not identity', () => {
  it('keeps a single natural-key upsert regardless of discovering collaborator context', async () => {
    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
    const details = samplePullRequestDetails({ authorGithubLogin: 'alice-dev' });
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
      getPullRequest: vi.fn().mockResolvedValue(details),
      listIssueComments: vi.fn().mockResolvedValue([]),
      listReviews: vi.fn().mockResolvedValue([]),
    };
    const deps: GithubPrImportDeps = {
      apiClient,
      listUsersWithGithubLogin: async () => [
        { id: 'u1', githubLogin: 'alice-dev' },
        { id: 'u2', githubLogin: 'alice-dev' },
      ],
      listEnabledOrganizations: async () => ['acme'],
      upsertControl: vi.fn().mockResolvedValue({}),
      upsertPullRequestBundle,
    };

    await runGithubPrImport({ startDate: '2026-08-09', endDate: '2026-08-09' }, deps);

    for (const call of upsertPullRequestBundle.mock.calls) {
      expect(call[0]).toEqual(
        expect.objectContaining({
          repositoryId: '500',
          githubPullRequestId: '1001',
          authorGithubLogin: 'alice-dev',
        }),
      );
      expect(call).toHaveLength(3);
    }
  });
});
