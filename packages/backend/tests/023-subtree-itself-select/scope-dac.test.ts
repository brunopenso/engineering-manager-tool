import { describe, expect, it } from 'vitest';
import { parseHierarchyScope } from '../../src/types/hierarchySelectionScope.js';

describe('hierarchy selection scope DAC helpers', () => {
  it('rejects invalid scope values', () => {
    expect(() => parseHierarchyScope('team')).toThrow(/subtree|itself/);
  });

  it('accepts subtree and itself', () => {
    expect(parseHierarchyScope('subtree')).toBe('subtree');
    expect(parseHierarchyScope('itself')).toBe('itself');
  });

  it('treats empty scope as undefined (default applied by callers)', () => {
    expect(parseHierarchyScope(undefined)).toBeUndefined();
    expect(parseHierarchyScope('')).toBeUndefined();
  });
});
