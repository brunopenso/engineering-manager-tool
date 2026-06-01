export type DeliverableReviewNotesResponse = {
  deliverableId: string;
  notes: string | null;
  reviewed: boolean;
  updatedAt: string | null;
};

export type SaveDeliverableReviewNotesRequest = {
  notes: string;
};
