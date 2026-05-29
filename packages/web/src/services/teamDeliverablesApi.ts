export type TeamMemberOption = {
  id: string;
  displayName: string;
};

export type TeamDeliverableRow = {
  id: string;
  title: string;
  description: string;
  reviewed: boolean;
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

export class TeamDeliverablesApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'TeamDeliverablesApiError';
    this.code = code;
  }
}

async function parseError(response: Response): Promise<TeamDeliverablesApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // ignored
  }

  return new TeamDeliverablesApiError(
    payload?.code ?? 'FORBIDDEN',
    payload?.message ?? 'Request failed.',
  );
}

export async function fetchTeamMembers(accessToken: string): Promise<TeamMemberOption[]> {
  const response = await fetch(`${API_BASE_URL}/users/leader/team-members`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { members: TeamMemberOption[] };
  return payload.members;
}

export async function searchTeamDeliverables(
  accessToken: string,
  params: { userId: string; startDate: string; endDate: string },
): Promise<{ ownerUserId: string; deliverables: TeamDeliverableRow[] }> {
  const query = new URLSearchParams({
    userId: params.userId,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const response = await fetch(`${API_BASE_URL}/users/leader/team-deliverables?${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as {
    ownerUserId: string;
    deliverables: TeamDeliverableRow[];
  };
}

export async function setDeliverableReviewed(
  accessToken: string,
  deliverableId: string,
  reviewed: boolean,
): Promise<{ deliverableId: string; reviewed: boolean }> {
  const response = await fetch(`${API_BASE_URL}/deliverables/${deliverableId}/reviewed`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reviewed }),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as { deliverableId: string; reviewed: boolean };
}

export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultLast30DayRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 29);

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  };
}

export function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) {
    return false;
  }

  return startDate <= endDate;
}
