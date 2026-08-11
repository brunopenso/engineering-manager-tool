import { describe, expect, it } from 'vitest';
import {
  applyActivityFilters,
  buildAuthoredWeeklySeries,
  countActorComments,
  countActorReviews,
  deriveRepositoryOptions,
  filterByRepository,
  sortByMergedAtDesc,
} from '../../src/utils/myPullRequestActivity.js';
import { sampleActivityPr } from './fixtures.js';

describe('US2 activity filter helpers', () => {
  it('derives repository options from period results', () => {
    const options = deriveRepositoryOptions([
      sampleActivityPr({ id: '1', organization: 'acme', repository: 'widgets' }),
      sampleActivityPr({ id: '2', organization: 'acme', repository: 'widgets' }),
      sampleActivityPr({ id: '3', organization: 'acme', repository: 'tools' }),
    ]);
    expect(options.map((option) => option.key)).toEqual(['acme/tools', 'acme/widgets']);
  });

  it('filters by repository and clears to all', () => {
    const rows = [
      sampleActivityPr({ id: '1', repository: 'widgets' }),
      sampleActivityPr({ id: '2', repository: 'tools' }),
    ];
    expect(filterByRepository(rows, 'acme/widgets')).toHaveLength(1);
    expect(filterByRepository(rows, null)).toHaveLength(2);
  });

  it('filters by classification type and complexity index', () => {
    const rows = [
      sampleActivityPr({ id: '1', classificationType: 'feature', complexityIndex: 2 }),
      sampleActivityPr({ id: '2', classificationType: 'fix', complexityIndex: 4 }),
      sampleActivityPr({ id: '3', classificationType: 'documentation', complexityIndex: 1 }),
      sampleActivityPr({
        id: '4',
        classificationType: 'feature',
        userReclassification: 'fix',
        complexityIndex: 2,
      }),
    ];
    expect(
      applyActivityFilters(rows, {
        repositoryKey: null,
        classificationType: 'fix',
        complexityIndex: null,
      }).map((pr) => pr.id),
    ).toEqual(['2', '4']);
    expect(
      applyActivityFilters(rows, {
        repositoryKey: null,
        classificationType: null,
        complexityIndex: 1,
      }).map((pr) => pr.id),
    ).toEqual(['3']);
  });
});

describe('US3 summary helpers', () => {
  it('builds authored weekly series without counting involved-only PRs', () => {
    const series = buildAuthoredWeeklySeries(
      [
        sampleActivityPr({
          id: '1',
          involvementRole: 'owner',
          mergedAt: '2026-08-03T12:00:00.000Z',
        }),
        sampleActivityPr({
          id: '2',
          involvementRole: 'involved',
          authorGithubLogin: 'bob',
          mergedAt: '2026-08-04T12:00:00.000Z',
        }),
      ],
      { startDate: '2026-08-01', endDate: '2026-08-14' },
    );
    const total = series.reduce((sum, bucket) => sum + bucket.count, 0);
    expect(total).toBe(1);
  });

  it('counts actor comments and reviews only', () => {
    const rows = [
      sampleActivityPr({
        id: '1',
        comments: [
          {
            id: 'c1',
            githubCommentId: '1',
            authorGithubLogin: 'alice-dev',
            body: 'a',
            createdAt: '2026-08-01T13:00:00.000Z',
            updatedAt: '2026-08-01T13:00:00.000Z',
            url: null,
          },
          {
            id: 'c2',
            githubCommentId: '2',
            authorGithubLogin: 'bob',
            body: 'b',
            createdAt: '2026-08-01T13:00:00.000Z',
            updatedAt: '2026-08-01T13:00:00.000Z',
            url: null,
          },
        ],
        reviews: [
          {
            id: 'r1',
            githubReviewId: '1',
            reviewerGithubLogin: 'alice-dev',
            body: null,
            state: 'APPROVED',
            createdAt: '2026-08-01T14:00:00.000Z',
            updatedAt: null,
            url: null,
          },
        ],
      }),
    ];
    expect(countActorComments(rows, 'alice-dev')).toBe(1);
    expect(countActorReviews(rows, 'alice-dev')).toBe(1);
  });
});

describe('US4 sort helpers', () => {
  it('sorts by mergedAt descending', () => {
    const sorted = sortByMergedAtDesc([
      sampleActivityPr({ id: 'old', mergedAt: '2026-07-01T00:00:00.000Z' }),
      sampleActivityPr({ id: 'new', mergedAt: '2026-08-10T00:00:00.000Z' }),
    ]);
    expect(sorted.map((pr) => pr.id)).toEqual(['new', 'old']);
  });
});
