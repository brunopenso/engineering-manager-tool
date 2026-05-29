import type { HierarchyDescendantRow, HierarchyViewNode } from '../types/hierarchyView.js';

export function toHierarchyDisplayName(fullName: string, email: string): string {
  const trimmed = fullName.trim();
  return trimmed.length > 0 ? trimmed : email;
}

export function buildHierarchyTreeFromRows(
  rows: HierarchyDescendantRow[],
  parentId: string,
): HierarchyViewNode[] {
  return rows
    .filter((row) => row.leader_id === parentId)
    .map((row) => {
      const children = buildHierarchyTreeFromRows(rows, row.id);
      return {
        id: row.id,
        displayName: toHierarchyDisplayName(row.full_name, row.email),
        email: row.email,
        isLeader: false,
        ...(children.length > 0 ? { children } : {}),
      };
    });
}

export function toHierarchyViewNode(
  user: { id: string; fullName: string; email: string },
  isCurrentPosition = false,
): HierarchyViewNode {
  return {
    id: user.id,
    displayName: toHierarchyDisplayName(user.fullName, user.email),
    email: user.email,
    isLeader: false,
    ...(isCurrentPosition ? { isCurrentPosition: true } : {}),
  };
}

export function collectHierarchyNodeIds(nodes: HierarchyViewNode[]): string[] {
  const ids: string[] = [];

  for (const node of nodes) {
    ids.push(node.id);
    if (node.children) {
      ids.push(...collectHierarchyNodeIds(node.children));
    }
  }

  return ids;
}

export function enrichHierarchyNodeWithLeaderFlag(
  node: HierarchyViewNode,
  leaderIds: ReadonlySet<string>,
): HierarchyViewNode {
  return {
    ...node,
    isLeader: leaderIds.has(node.id),
    ...(node.children
      ? {
          children: node.children.map((child) =>
            enrichHierarchyNodeWithLeaderFlag(child, leaderIds),
          ),
        }
      : {}),
  };
}
