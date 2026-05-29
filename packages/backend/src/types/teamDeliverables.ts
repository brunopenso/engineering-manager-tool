export type TeamMemberOption = {
  id: string;
  displayName: string;
};

export type TeamMembersResponse = {
  members: TeamMemberOption[];
};

export type TeamDeliverableSystemTag = {
  id: string;
  name: string;
  color: string;
};

export type TeamDeliverableRow = {
  id: string;
  title: string;
  description: string;
  reviewed: boolean;
  systemTags: TeamDeliverableSystemTag[];
};

export type TeamDeliverablesSearchResponse = {
  ownerUserId: string;
  deliverables: TeamDeliverableRow[];
};

export type SetDeliverableReviewedResponse = {
  deliverableId: string;
  reviewed: boolean;
};
