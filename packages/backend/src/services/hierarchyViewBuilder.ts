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
    ...(isCurrentPosition ? { isCurrentPosition: true } : {}),
  };
}
