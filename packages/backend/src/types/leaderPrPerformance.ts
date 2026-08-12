export const PR_PERFORMANCE_CLASSIFICATIONS = [
  'feature',
  'fix',
  'documentation',
  'maintenance',
  'unclassified',
] as const;

export type PrPerformanceClassification = (typeof PR_PERFORMANCE_CLASSIFICATIONS)[number];

export type PerformanceTotals = {
  authoredPullRequestCount: number;
  commentCount: number;
  reviewCount: number;
};

export type DeveloperPrPerformanceRow = {
  userId: string;
  displayName: string;
  email: string;
  githubLogin: string | null;
  authoredPullRequestCount: number;
  commentCount: number;
  reviewCount: number;
};

export type WeeklyClassificationBucketRow = {
  weekStart: string;
  classification: PrPerformanceClassification;
  count: number;
};

export type TeamPrPerformanceResponse = {
  startDate: string;
  endDate: string;
  userId?: string;
  totals: PerformanceTotals;
  developers: DeveloperPrPerformanceRow[];
  weekStarts: string[];
  authoredByWeekAndClassification: WeeklyClassificationBucketRow[];
};

export type TeamPrPerformanceFilters = {
  startDate: string;
  endDate: string;
  userId?: string;
};

export type DeveloperPrDrilldownItem = {
  id: string;
  title: string;
  repository: string;
  mergedAt: string;
  involvementRole: 'owner' | 'involved';
  effectiveClassification: PrPerformanceClassification;
  url: string | null;
  actorCommentCount: number;
  actorReviewCount: number;
};

export type DeveloperPrDrilldownResponse = {
  userId: string;
  startDate: string;
  endDate: string;
  pullRequests: DeveloperPrDrilldownItem[];
};
