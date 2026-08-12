import { describe, expect, it } from 'vitest';
import {
  normalizeClassification,
  resolveEffectiveClassification,
  sortDevelopersByAuthoredThenName,
} from '../../src/services/leaderPrPerformanceService.js';

describe('US3 team PR performance summaries helpers', () => {
  it('sorts developers by authored count desc then display name', () => {
    const sorted = sortDevelopersByAuthoredThenName([
      {
        userId: 'b',
        displayName: 'Bob',
        email: 'bob@example.com',
        githubLogin: 'bob',
        authoredPullRequestCount: 1,
        commentCount: 5,
        reviewCount: 0,
      },
      {
        userId: 'a',
        displayName: 'Alice',
        email: 'alice@example.com',
        githubLogin: 'alice',
        authoredPullRequestCount: 3,
        commentCount: 1,
        reviewCount: 2,
      },
      {
        userId: 'c',
        displayName: 'Cara',
        email: 'cara@example.com',
        githubLogin: null,
        authoredPullRequestCount: 3,
        commentCount: 0,
        reviewCount: 0,
      },
    ]);

    expect(sorted.map((row) => row.userId)).toEqual(['a', 'c', 'b']);
  });

  it('sums authored/comment/review independently (author can also have comments)', () => {
    const developers = sortDevelopersByAuthoredThenName([
      {
        userId: 'a',
        displayName: 'Alice',
        email: 'alice@example.com',
        githubLogin: 'alice',
        authoredPullRequestCount: 2,
        commentCount: 4,
        reviewCount: 1,
      },
    ]);

    const totals = developers.reduce(
      (acc, row) => ({
        authoredPullRequestCount: acc.authoredPullRequestCount + row.authoredPullRequestCount,
        commentCount: acc.commentCount + row.commentCount,
        reviewCount: acc.reviewCount + row.reviewCount,
      }),
      { authoredPullRequestCount: 0, commentCount: 0, reviewCount: 0 },
    );

    expect(totals).toEqual({
      authoredPullRequestCount: 2,
      commentCount: 4,
      reviewCount: 1,
    });
  });
});

describe('US5 classification helpers', () => {
  it('prefers user reclassification over system classification', () => {
    expect(resolveEffectiveClassification('documentation', 'feature')).toBe('documentation');
  });

  it('falls back to unclassified when both are missing', () => {
    expect(resolveEffectiveClassification(null, null)).toBe('unclassified');
    expect(normalizeClassification('unknown-type')).toBe('unclassified');
  });
});
