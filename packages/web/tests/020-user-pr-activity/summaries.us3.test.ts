import { describe, expect, it } from 'vitest';
import {
  buildAuthoredWeeklySeries,
  countActorComments,
  countActorReviews,
} from '../../src/utils/myPullRequestActivity.js';
import { sampleActivityPr } from './fixtures.js';

describe('US3 summaries unit coverage', () => {
  it('keeps zero authored chart total when only involved PRs exist', () => {
    const series = buildAuthoredWeeklySeries(
      [
        sampleActivityPr({
          involvementRole: 'involved',
          authorGithubLogin: 'bob',
          comments: [
            {
              id: 'c1',
              githubCommentId: '1',
              authorGithubLogin: 'alice-dev',
              body: 'x',
              createdAt: '2026-08-01T13:00:00.000Z',
              updatedAt: '2026-08-01T13:00:00.000Z',
              url: null,
            },
          ],
        }),
      ],
      { startDate: '2026-08-01', endDate: '2026-08-07' },
    );
    expect(series.every((bucket) => bucket.count === 0)).toBe(true);
    expect(
      countActorComments(
        [
          sampleActivityPr({
            involvementRole: 'involved',
            authorGithubLogin: 'bob',
            comments: [
              {
                id: 'c1',
                githubCommentId: '1',
                authorGithubLogin: 'alice-dev',
                body: 'x',
                createdAt: '2026-08-01T13:00:00.000Z',
                updatedAt: '2026-08-01T13:00:00.000Z',
                url: null,
              },
            ],
          }),
        ],
        'alice-dev',
      ),
    ).toBe(1);
    expect(countActorReviews([], 'alice-dev')).toBe(0);
  });
});
