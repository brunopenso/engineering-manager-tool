export type HierarchyOrphanUserSummary = {
  id: string;
  fullName: string;
  email: string;
};

export type HierarchySearchInput = {
  query?: string;
  excludeUserId?: string;
};

export type HierarchyAssignResult = {
  userId: string;
  leaderId: string;
  updatedAt: string;
};

export type HierarchyAssignmentAuditEvent = {
  actorLeaderUserId: string;
  targetUserId: string;
  previousLeaderId: string | null;
  newLeaderId: string;
  assignedAt: string;
};
