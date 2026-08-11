export type InvolvementRole = 'owner' | 'involved';

export type MyActivityComment = {
  id: string;
  githubCommentId: string;
  authorGithubLogin: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  url: string | null;
};

export type MyActivityReview = {
  id: string;
  githubReviewId: string;
  reviewerGithubLogin: string;
  body: string | null;
  state: string;
  createdAt: string;
  updatedAt: string | null;
  url: string | null;
};

export type MyActivityPullRequest = {
  id: string;
  githubPullRequestId: string;
  organization: string;
  repository: string;
  repositoryId: string;
  title: string;
  body: string | null;
  number: number;
  changedFilesCount: number;
  additionsCount: number;
  deletionsCount: number;
  sourceBranch: string;
  targetBranch: string;
  authorGithubLogin: string;
  mergedAt: string;
  url: string | null;
  comments: MyActivityComment[];
  reviews: MyActivityReview[];
  involvementRole: InvolvementRole;
};

export type MyPullRequestActivityResponse = {
  pullRequests: MyActivityPullRequest[];
};

type ApiErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'MISSING_APP_TOKEN'
  | 'INVALID_APP_TOKEN';

type ErrorResponse = {
  code: ApiErrorCode;
  message: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export class MyPullRequestsApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'MyPullRequestsApiError';
    this.code = code;
  }
}

async function parseError(response: Response): Promise<MyPullRequestsApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // ignored
  }

  return new MyPullRequestsApiError(
    payload?.code ?? 'FORBIDDEN',
    payload?.message ?? 'Request failed.',
  );
}

export async function fetchMyPullRequestActivity(
  accessToken: string,
  params: { startDate: string; endDate: string },
): Promise<MyPullRequestActivityResponse> {
  const response = await fetch(`${API_BASE_URL}/github-pull-requests/my-activity`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as MyPullRequestActivityResponse;
}

export { defaultLast60DayRange, formatDateInput, isValidDateRange } from '../utils/dateRange.js';
