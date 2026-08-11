import { describe, expect, it, vi } from 'vitest';
import type { GithubApiClient } from '../../src/services/githubApiClient.js';
import {
  assertPullRequestNaturalKey,
  GithubPrNaturalKeyError,
  runGithubPrImport,
  type GithubPrImportDeps,
} from '../../src/services/githubPrImportService.js';
import { samplePullRequestDetails } from '../018-github-pr-import/github-pr-import.setup.js';

function baseDeps(overrides: Partial<GithubPrImportDeps> = {}): GithubPrImportDeps {
  const details = samplePullRequestDetails();
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
  return {
    apiClient,
    listUsersWithGithubLogin: async () => [{ id: 'u1', githubLogin: 'alice-dev' }],
    listEnabledOrganizations: async () => ['acme'],
    upsertControl: vi.fn().mockResolvedValue({}),
    upsertPullRequestBundle: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('US1 natural-key persist', () => {
  it('rejects incomplete natural keys', () => {
    expect(() =>
      assertPullRequestNaturalKey({ repositoryId: '', githubPullRequestId: '1001' }),
    ).toThrow(GithubPrNaturalKeyError);
    expect(() =>
      assertPullRequestNaturalKey({ repositoryId: '500', githubPullRequestId: '  ' }),
    ).toThrow(GithubPrNaturalKeyError);
    expect(() =>
      assertPullRequestNaturalKey({ repositoryId: '500', githubPullRequestId: '1001' }),
    ).not.toThrow();
  });

  it('upserts by natural key fields and does not pass collaborator ownership', async () => {
    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
    await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      baseDeps({ upsertPullRequestBundle }),
    );

    expect(upsertPullRequestBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: '500',
        githubPullRequestId: '1001',
        authorGithubLogin: 'alice-dev',
      }),
      [],
      [],
    );
    expect(upsertPullRequestBundle.mock.calls[0]).toHaveLength(3);
  });

  it('refuses persist when getPullRequest returns blank natural key', async () => {
    const upsertPullRequestBundle = vi.fn();
    const upsertControl = vi.fn().mockResolvedValue({});
    const summary = await runGithubPrImport(
      { startDate: '2026-08-09', endDate: '2026-08-09' },
      baseDeps({
        apiClient: {
          searchMergedPullRequests: vi.fn().mockResolvedValue([
            {
              organization: 'acme',
              repository: 'widgets',
              repositoryId: '',
              number: 42,
              githubPullRequestId: '1001',
            },
          ]),
          getPullRequest: vi
            .fn()
            .mockResolvedValue(
              samplePullRequestDetails({ repositoryId: '', githubPullRequestId: '1001' }),
            ),
          listIssueComments: vi.fn().mockResolvedValue([]),
          listReviews: vi.fn().mockResolvedValue([]),
        },
        upsertPullRequestBundle,
        upsertControl,
      }),
    );

    expect(upsertPullRequestBundle).not.toHaveBeenCalled();
    expect(summary.failed).toBe(1);
    // Incomplete natural key cannot be audited on the PR control table.
    expect(upsertControl).not.toHaveBeenCalled();
  });

  it('updates existing PR via natural-key upsert path on re-import', async () => {
    const upsertPullRequestBundle = vi.fn().mockResolvedValue(undefined);
    const deps = baseDeps({
      upsertPullRequestBundle,
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
        getPullRequest: vi
          .fn()
          .mockResolvedValueOnce(samplePullRequestDetails({ title: 'First' }))
          .mockResolvedValueOnce(samplePullRequestDetails({ title: 'Second' })),
        listIssueComments: vi.fn().mockResolvedValue([]),
        listReviews: vi.fn().mockResolvedValue([]),
      },
    });

    await runGithubPrImport({ startDate: '2026-08-09', endDate: '2026-08-09' }, deps);
    await runGithubPrImport({ startDate: '2026-08-09', endDate: '2026-08-09' }, deps);

    expect(upsertPullRequestBundle).toHaveBeenCalledTimes(2);
    expect(upsertPullRequestBundle.mock.calls[0][0].title).toBe('First');
    expect(upsertPullRequestBundle.mock.calls[1][0].title).toBe('Second');
    expect(upsertPullRequestBundle.mock.calls[0][0].repositoryId).toBe('500');
    expect(upsertPullRequestBundle.mock.calls[1][0].githubPullRequestId).toBe('1001');
  });
});
