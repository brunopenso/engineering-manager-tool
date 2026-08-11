import { describe, expect, it } from 'vitest';
import { validateGithubPullRequestQueryInput } from '../../src/services/githubPrQueryService.js';

describe('US2 author-login retrieve contract', () => {
  it('accepts github logins and date filters used for author-based matching', () => {
    const input = validateGithubPullRequestQueryInput({
      githubLogins: ['Alice-Dev'],
      startDate: '2026-08-09',
      endDate: '2026-08-09',
    });
    expect(input.githubLogins).toEqual(['Alice-Dev']);
    expect(input.startDate).toBe('2026-08-09');
  });
});
