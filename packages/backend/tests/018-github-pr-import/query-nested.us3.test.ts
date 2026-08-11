import { describe, expect, it, vi } from 'vitest';
import {
  assertCanReadGithubImportedDataForUser,
  mapImportedPullRequest,
} from '../../src/services/githubPrQueryService.js';
import * as authorizationService from '../../src/services/authorizationService.js';
import type { GithubImportedPullRequest } from '../../src/database/entities/GithubImportedPullRequest.js';

describe('US3 authorization helper', () => {
  it('allows administrators without hierarchy check', async () => {
    const spy = vi
      .spyOn(authorizationService, 'canReadDeliverablesForOwner')
      .mockResolvedValue(false);
    await expect(
      assertCanReadGithubImportedDataForUser('admin-1', ['ADMINISTRATOR'], 'other'),
    ).resolves.toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('denies when not admin and not self/descendant', async () => {
    const spy = vi
      .spyOn(authorizationService, 'canReadDeliverablesForOwner')
      .mockResolvedValue(false);
    await expect(
      assertCanReadGithubImportedDataForUser('actor', ['COLLABORATOR'], 'peer'),
    ).rejects.toMatchObject({ name: 'FORBIDDEN' });
    spy.mockRestore();
  });
});

describe('query DTO mapping', () => {
  it('maps nested comments and reviews', () => {
    const dto = mapImportedPullRequest({
      id: 'pr-1',
      githubPullRequestId: '1001',
      organization: 'acme',
      repository: 'widgets',
      repositoryId: '500',
      title: 'Fix',
      body: null,
      number: 1,
      changedFilesCount: 1,
      additionsCount: 1,
      deletionsCount: 0,
      sourceBranch: 'a',
      targetBranch: 'b',
      authorGithubLogin: 'alice',
      mergedAt: new Date('2026-08-09T12:00:00.000Z'),
      url: null,
      classificationType: 'fix',
      complexityIndex: 2,
      comments: [
        {
          id: 'c1',
          githubCommentId: '10',
          authorGithubLogin: 'bob',
          body: 'hi',
          createdAtGithub: new Date('2026-08-09T13:00:00.000Z'),
          updatedAtGithub: new Date('2026-08-09T13:00:00.000Z'),
          url: null,
        },
      ],
      reviews: [
        {
          id: 'r1',
          githubReviewId: '20',
          reviewerGithubLogin: 'carol',
          body: null,
          state: 'COMMENTED',
          createdAtGithub: new Date('2026-08-09T14:00:00.000Z'),
          updatedAtGithub: null,
          url: null,
        },
      ],
    } as unknown as GithubImportedPullRequest);

    expect(dto.comments).toHaveLength(1);
    expect(dto.reviews[0].state).toBe('COMMENTED');
    expect(dto.classificationType).toBe('fix');
    expect(dto.userReclassification).toBeNull();
    expect(dto.complexityIndex).toBe(2);
  });

  it('maps null classification fields for legacy rows', () => {
    const dto = mapImportedPullRequest({
      id: 'pr-2',
      githubPullRequestId: '1002',
      organization: 'acme',
      repository: 'widgets',
      repositoryId: '500',
      title: 'Legacy',
      body: null,
      number: 2,
      changedFilesCount: 1,
      additionsCount: 1,
      deletionsCount: 0,
      sourceBranch: 'a',
      targetBranch: 'b',
      authorGithubLogin: 'alice',
      mergedAt: new Date('2026-08-09T12:00:00.000Z'),
      url: null,
      classificationType: null,
      userReclassification: null,
      complexityIndex: null,
      comments: [],
      reviews: [],
    } as unknown as GithubImportedPullRequest);

    expect(dto.classificationType).toBeNull();
    expect(dto.userReclassification).toBeNull();
    expect(dto.complexityIndex).toBeNull();
  });
});
