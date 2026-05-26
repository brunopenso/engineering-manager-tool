export type OrganizationalHierarchyResolver = {
  isDescendantOf(descendantUserId: string, ancestorUserId: string): boolean;
};

let hierarchyResolver: OrganizationalHierarchyResolver | null = null;

export function setOrganizationalHierarchyResolverForTests(
  resolver: OrganizationalHierarchyResolver | null,
): void {
  hierarchyResolver = resolver;
}

export function isOrganizationalDescendantOf(
  descendantUserId: string,
  ancestorUserId: string,
): boolean {
  if (!hierarchyResolver) {
    return false;
  }

  return hierarchyResolver.isDescendantOf(descendantUserId, ancestorUserId);
}
