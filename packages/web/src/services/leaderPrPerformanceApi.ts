export type PrPerformanceClassification =
  'feature' | 'fix' | 'documentation' | 'maintenance' | 'unclassified';

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
  scope?: 'subtree' | 'itself';
  totals: PerformanceTotals;
  developers: DeveloperPrPerformanceRow[];
  weekStarts: string[];
  authoredByWeekAndClassification: WeeklyClassificationBucketRow[];
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

type ApiErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'LEADER_REQUIRED'
  | 'MISSING_APP_TOKEN'
  | 'INVALID_APP_TOKEN';

type ErrorResponse = {
  code: ApiErrorCode;
  message: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export class LeaderPrPerformanceApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'LeaderPrPerformanceApiError';
    this.code = code;
  }
}

async function parseError(response: Response): Promise<LeaderPrPerformanceApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // ignored
  }

  return new LeaderPrPerformanceApiError(
    payload?.code ?? 'FORBIDDEN',
    payload?.message ?? 'Request failed.',
  );
}

export async function fetchTeamPrPerformance(
  accessToken: string,
  params: {
    startDate: string;
    endDate: string;
    userId?: string;
    scope?: 'subtree' | 'itself';
  },
): Promise<TeamPrPerformanceResponse> {
  const query = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  if (params.userId) {
    query.set('userId', params.userId);
    query.set('scope', params.scope ?? 'subtree');
  }

  const response = await fetch(`${API_BASE_URL}/users/leader/team-pr-performance?${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as TeamPrPerformanceResponse;
}

export async function fetchDeveloperPrDrilldown(
  accessToken: string,
  params: { userId: string; startDate: string; endDate: string },
): Promise<DeveloperPrDrilldownResponse> {
  const query = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const response = await fetch(
    `${API_BASE_URL}/users/leader/team-pr-performance/developers/${encodeURIComponent(params.userId)}/pull-requests?${query}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as DeveloperPrDrilldownResponse;
}

export { defaultLast60DayRange, formatDateInput, isValidDateRange } from '../utils/dateRange.js';
