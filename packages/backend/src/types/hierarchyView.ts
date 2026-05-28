export type HierarchyViewNode = {
  id: string;
  displayName: string;
  email: string;
  isCurrentPosition?: boolean;
  children?: HierarchyViewNode[];
};

export type LeaderHierarchyViewResponse = {
  manager: HierarchyViewNode | null;
  self: HierarchyViewNode;
  reports: HierarchyViewNode[];
};

export type HierarchyDescendantRow = {
  id: string;
  full_name: string;
  email: string;
  leader_id: string;
};
