import { describe, expect, it } from 'vitest';
import { toHierarchyDisplayName } from '../../src/services/hierarchyViewBuilder.js';

describe('hierarchy view display name', () => {
  it('uses email when full name is blank', () => {
    expect(toHierarchyDisplayName('   ', 'fallback@example.com')).toBe('fallback@example.com');
  });

  it('uses trimmed full name when present', () => {
    expect(toHierarchyDisplayName('  Alice  ', 'alice@example.com')).toBe('Alice');
  });
});
