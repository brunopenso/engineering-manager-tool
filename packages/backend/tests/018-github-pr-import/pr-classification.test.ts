import { describe, expect, it } from 'vitest';
import {
  classificationFieldsForDetails,
  classifyPullRequestType,
  computeComplexityIndex,
} from '../../src/services/githubPrClassification.js';

describe('classifyPullRequestType', () => {
  it('prefers branch over title and body', () => {
    expect(
      classifyPullRequestType({
        sourceBranch: 'fix/timeout',
        title: 'feat: improve UX',
        body: 'Adds a new feature',
      }),
    ).toBe('fix');
  });

  it('classifies branch prefixes with separators', () => {
    expect(
      classifyPullRequestType({
        sourceBranch: 'feat/login',
        title: 'misc',
        body: null,
      }),
    ).toBe('feature');
    expect(
      classifyPullRequestType({
        sourceBranch: 'fix-auth-timeout',
        title: 'misc',
        body: null,
      }),
    ).toBe('fix');
    expect(
      classifyPullRequestType({
        sourceBranch: 'docs_readme',
        title: 'misc',
        body: null,
      }),
    ).toBe('documentation');
  });

  it('uses title when branch has no signal', () => {
    expect(
      classifyPullRequestType({
        sourceBranch: 'alice/work-item-12',
        title: 'feat(api): add endpoint',
        body: null,
      }),
    ).toBe('feature');
    expect(
      classifyPullRequestType({
        sourceBranch: 'alice/work-item-12',
        title: 'fix: null pointer',
        body: null,
      }),
    ).toBe('fix');
  });

  it('uses body when branch and title have no signal', () => {
    expect(
      classifyPullRequestType({
        sourceBranch: 'alice/work-item-12',
        title: 'Update things',
        body: 'This updates the documentation for the CLI.',
      }),
    ).toBe('documentation');
  });

  it('falls back to feature when nothing matches', () => {
    expect(
      classifyPullRequestType({
        sourceBranch: 'alice/work-item-12',
        title: 'Update things',
        body: 'No signals here',
      }),
    ).toBe('feature');
  });

  it('matches keyword fallbacks in title', () => {
    expect(
      classifyPullRequestType({
        sourceBranch: 'alice/work',
        title: 'Hotfix production outage',
        body: null,
      }),
    ).toBe('fix');
  });

  it('classifies maintenance for deps and upgrades', () => {
    expect(
      classifyPullRequestType({
        sourceBranch: 'chore/deps-react',
        title: 'feat: unrelated',
        body: null,
      }),
    ).toBe('maintenance');
    expect(
      classifyPullRequestType({
        sourceBranch: 'deps/upgrade-lodash',
        title: 'misc',
        body: null,
      }),
    ).toBe('maintenance');
    expect(
      classifyPullRequestType({
        sourceBranch: 'alice/work-item-12',
        title: 'chore(deps): bump typescript',
        body: null,
      }),
    ).toBe('maintenance');
    expect(
      classifyPullRequestType({
        sourceBranch: 'alice/work-item-12',
        title: 'build(deps): update eslint',
        body: null,
      }),
    ).toBe('maintenance');
    expect(
      classifyPullRequestType({
        sourceBranch: 'alice/work',
        title: 'Upgrade dependencies to latest',
        body: null,
      }),
    ).toBe('maintenance');
  });
});

describe('computeComplexityIndex', () => {
  it('returns 1 for tiny changes', () => {
    expect(
      computeComplexityIndex({ changedFilesCount: 1, additionsCount: 5, deletionsCount: 2 }),
    ).toBe(1);
  });

  it('returns 2 at file or line thresholds', () => {
    expect(
      computeComplexityIndex({ changedFilesCount: 3, additionsCount: 0, deletionsCount: 0 }),
    ).toBe(2);
    expect(
      computeComplexityIndex({ changedFilesCount: 1, additionsCount: 20, deletionsCount: 10 }),
    ).toBe(2);
  });

  it('returns 3–5 for larger changes', () => {
    expect(
      computeComplexityIndex({ changedFilesCount: 8, additionsCount: 0, deletionsCount: 0 }),
    ).toBe(3);
    expect(
      computeComplexityIndex({ changedFilesCount: 1, additionsCount: 400, deletionsCount: 0 }),
    ).toBe(4);
    expect(
      computeComplexityIndex({ changedFilesCount: 40, additionsCount: 0, deletionsCount: 0 }),
    ).toBe(5);
    expect(
      computeComplexityIndex({ changedFilesCount: 1, additionsCount: 600, deletionsCount: 400 }),
    ).toBe(5);
  });

  it('clamps negative inputs', () => {
    expect(
      computeComplexityIndex({ changedFilesCount: -5, additionsCount: -10, deletionsCount: -1 }),
    ).toBe(1);
  });
});

describe('classificationFieldsForDetails', () => {
  it('returns both classification fields for import upsert', () => {
    expect(
      classificationFieldsForDetails({
        sourceBranch: 'feature/fix',
        title: 'Fix widgets',
        body: 'Details',
        changedFilesCount: 3,
        additionsCount: 10,
        deletionsCount: 2,
      }),
    ).toEqual({
      classificationType: 'feature',
      complexityIndex: 2,
    });
  });
});
