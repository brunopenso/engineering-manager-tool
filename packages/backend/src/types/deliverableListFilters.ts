import type { BusinessImpact } from '../database/entities/Deliverable.js';

export type DeliverableListFilters = {
  startDate: string;
  endDate: string;
  businessImpacts?: BusinessImpact[];
  systemTagIds?: string[];
};
