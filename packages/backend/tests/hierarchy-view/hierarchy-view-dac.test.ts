import { describe, expect, it } from 'vitest';
import { buildHierarchyTreeFromRows } from '../../src/services/hierarchyViewBuilder.js';

describe('hierarchy view DAC tree assembly', () => {
  it('includes only descendants under the actor subtree', () => {
    const rows = [
      {
        id: 'report-1',
        full_name: 'Direct Report',
        email: 'direct@example.com',
        leader_id: 'leader-1',
      },
      {
        id: 'report-2',
        full_name: 'Indirect Report',
        email: 'indirect@example.com',
        leader_id: 'report-1',
      },
      {
        id: 'peer-1',
        full_name: 'Peer Branch',
        email: 'peer@example.com',
        leader_id: 'manager-1',
      },
    ];

    const tree = buildHierarchyTreeFromRows(rows, 'leader-1');

    expect(tree.map((node) => node.id)).toEqual(['report-1']);
    expect(tree[0]?.children?.map((node) => node.id)).toEqual(['report-2']);
    expect(tree.some((node) => node.id === 'peer-1')).toBe(false);
  });
});
