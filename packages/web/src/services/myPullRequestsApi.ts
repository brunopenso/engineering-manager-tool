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

export type PullRequestClassificationType = 'feature' | 'fix' | 'documentation' | 'maintenance';

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
  classificationType: PullRequestClassificationType | null;
  userReclassification: PullRequestClassificationType | null;
  complexityIndex: number | null;
  comments: MyActivityComment[];
  reviews: MyActivityReview[];
  involvementRole: InvolvementRole;
};

export type MyPullRequestActivityResponse = {
  pullRequests: MyActivityPullRequest[];
};

export type ClassificationTypesResponse = {
  types: PullRequestClassificationType[];
};

export type ReclassifyPullRequestsResponse = {
  updatedCount: number;
  pullRequests: Array<
    Omit<MyActivityPullRequest, 'involvementRole'> & { involvementRole?: InvolvementRole }
  >;
};

type ApiErrorCode =
  'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'MISSING_APP_TOKEN' | 'INVALID_APP_TOKEN';

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

export async function fetchClassificationTypes(
  accessToken: string,
): Promise<ClassificationTypesResponse> {
  const response = await fetch(`${API_BASE_URL}/github-pull-requests/classification-types`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as ClassificationTypesResponse;
}

export async function reclassifyPullRequests(
  accessToken: string,
  params: { pullRequestIds: string[]; classification: PullRequestClassificationType },
): Promise<ReclassifyPullRequestsResponse> {
  const response = await fetch(`${API_BASE_URL}/github-pull-requests/reclassify`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as ReclassifyPullRequestsResponse;
}

export type DeliverableProposal = {
  title: string;
  description: string;
  roleInDeliverable: string;
  businessImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'TRANSFORMATIONAL';
  improvementPoints: string;
  systemTagIds: string[];
  technicalDescription?: string | null;
  userTags?: string[];
  links?: { url: string; label?: string | null }[];
};

export type AnalyzeDeliverableFromPullRequestsResponse = {
  proposal: DeliverableProposal;
  sourcePullRequestIds: string[];
};

export async function analyzeDeliverableFromPullRequests(
  accessToken: string,
  params: { pullRequestIds: string[] },
): Promise<AnalyzeDeliverableFromPullRequestsResponse> {
  const response = await fetch(`${API_BASE_URL}/deliverables/from-pull-requests/analyze`, {
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

  return (await response.json()) as AnalyzeDeliverableFromPullRequestsResponse;
}

export { defaultLast60DayRange, formatDateInput, isValidDateRange } from '../utils/dateRange.js';
