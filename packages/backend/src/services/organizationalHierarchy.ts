export type OrganizationalHierarchyResolver = {
  isDescendantOf(descendantUserId: string, ancestorUserId: string): Promise<boolean>;
};

let hierarchyResolver: OrganizationalHierarchyResolver | null = null;

export function registerOrganizationalHierarchyResolver(
  resolver: OrganizationalHierarchyResolver,
): void {
  hierarchyResolver = resolver;
}

export function setOrganizationalHierarchyResolverForTests(
  resolver: OrganizationalHierarchyResolver | null,
): void {
  hierarchyResolver = resolver;
}

export async function isOrganizationalDescendantOf(
  descendantUserId: string,
  ancestorUserId: string,
): Promise<boolean> {
  if (!hierarchyResolver) {
    return false;
  }

  return hierarchyResolver.isDescendantOf(descendantUserId, ancestorUserId);
}
