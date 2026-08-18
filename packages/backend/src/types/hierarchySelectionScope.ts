export const HIERARCHY_SCOPES = ['subtree', 'itself'] as const;

export type HierarchyScope = (typeof HIERARCHY_SCOPES)[number];

export type ScopedOwnerResolution = {
  ownerUserIds: string[];
  filteredUserId?: string;
  scope?: HierarchyScope;
};

export function isHierarchyScope(value: unknown): value is HierarchyScope {
  return typeof value === 'string' && (HIERARCHY_SCOPES as readonly string[]).includes(value);
}

export function parseHierarchyScope(value: unknown): HierarchyScope | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (!isHierarchyScope(value)) {
    const error = new Error('scope must be "subtree" or "itself".');
    error.name = 'VALIDATION_ERROR';
    throw error;
  }

  return value;
}
