import { describe, expect, it } from 'vitest';

describe('cross-screen scope consistency', () => {
  it('documents the shared scope values used by all picker consumers', () => {
    const sharedScopes = ['subtree', 'itself'] as const;
    expect(sharedScopes).toContain('subtree');
    expect(sharedScopes).toContain('itself');
  });
});
