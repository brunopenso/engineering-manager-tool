export const BUSINESS_IMPACT_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'TRANSFORMATIONAL'] as const;

export type BusinessImpactLevel = (typeof BUSINESS_IMPACT_LEVELS)[number];

export type ImpactBucketRow = {
  weekStart: string;
  impact: BusinessImpactLevel;
  count: number;
};

export type PendingReviewByImpactRow = {
  impact: BusinessImpactLevel;
  count: number;
};

export type EngagementBucketRow = {
  weekStart: string;
  userId: string;
  displayName: string;
  count: number;
};

export type TeamAnalyticsResponse = {
  startDate: string;
  endDate: string;
  userId?: string;
  weekStarts: string[];
  deliverablesByWeekAndImpact: ImpactBucketRow[];
  engagementByWeek: EngagementBucketRow[];
  pendingReviewCount: number;
  pendingReviewByImpact: PendingReviewByImpactRow[];
};

export type TeamAnalyticsFilters = {
  startDate: string;
  endDate: string;
  userId?: string;
};
