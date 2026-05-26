import type { OrganizationalHierarchyResolver } from '../../services/organizationalHierarchy.js';

/** Users: top -> manager -> report | report2 (peers under manager) */
export const HIERARCHY_USER_IDS = {
  top: 'user-top',
  manager: 'user-manager',
  report: 'user-report',
  report2: 'user-report2',
} as const;

const DESCENDANTS_BY_ANCESTOR: Record<string, Set<string>> = {
  [HIERARCHY_USER_IDS.top]: new Set([
    HIERARCHY_USER_IDS.top,
    HIERARCHY_USER_IDS.manager,
    HIERARCHY_USER_IDS.report,
    HIERARCHY_USER_IDS.report2,
  ]),
  [HIERARCHY_USER_IDS.manager]: new Set([
    HIERARCHY_USER_IDS.manager,
    HIERARCHY_USER_IDS.report,
    HIERARCHY_USER_IDS.report2,
  ]),
  [HIERARCHY_USER_IDS.report]: new Set([HIERARCHY_USER_IDS.report]),
  [HIERARCHY_USER_IDS.report2]: new Set([HIERARCHY_USER_IDS.report2]),
};

export const sampleOrganizationalHierarchyResolver: OrganizationalHierarchyResolver = {
  isDescendantOf(descendantUserId, ancestorUserId) {
    const descendants = DESCENDANTS_BY_ANCESTOR[ancestorUserId];
    if (!descendants) {
      return false;
    }
    return descendants.has(descendantUserId);
  },
};
