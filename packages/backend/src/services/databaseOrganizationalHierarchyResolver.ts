import type { OrganizationalHierarchyResolver } from './organizationalHierarchy.js';
import { isUserInLeaderSubtree } from './userService.js';

export const databaseOrganizationalHierarchyResolver: OrganizationalHierarchyResolver = {
  isDescendantOf(descendantUserId, ancestorUserId) {
    return isUserInLeaderSubtree(ancestorUserId, descendantUserId);
  },
};
