export type BusinessImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'TRANSFORMATIONAL';

export type ImpactBucketRow = {
  weekStart: string;
  impact: BusinessImpactLevel;
  count: number;
};

export type EngagementBucketRow = {
  weekStart: string;
  userId: string;
  displayName: string;
  count: number;
};

export type PendingReviewByImpactRow = {
  impact: BusinessImpactLevel;
  count: number;
};

export type TeamAnalyticsResponse = {
  startDate: string;
  endDate: string;
  userId?: string;
  scope?: 'subtree' | 'itself';
  weekStarts: string[];
  deliverablesByWeekAndImpact: ImpactBucketRow[];
  engagementByWeek: EngagementBucketRow[];
  pendingReviewCount: number;
  pendingReviewByImpact: PendingReviewByImpactRow[];
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

export class LeaderAnalyticsApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'LeaderAnalyticsApiError';
    this.code = code;
  }
}

async function parseError(response: Response): Promise<LeaderAnalyticsApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // ignored
  }

  return new LeaderAnalyticsApiError(
    payload?.code ?? 'FORBIDDEN',
    payload?.message ?? 'Request failed.',
  );
}

export async function fetchTeamAnalytics(
  accessToken: string,
  params: {
    startDate: string;
    endDate: string;
    userId?: string;
    scope?: 'subtree' | 'itself';
  },
): Promise<TeamAnalyticsResponse> {
  const query = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  if (params.userId) {
    query.set('userId', params.userId);
    query.set('scope', params.scope ?? 'subtree');
  }

  const response = await fetch(`${API_BASE_URL}/users/leader/team-analytics?${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as TeamAnalyticsResponse;
}

export { defaultLast60DayRange, formatDateInput, isValidDateRange } from '../utils/dateRange.js';
