export type DeliverableReviewNotesResponse = {
  deliverableId: string;
  notes: string | null;
  reviewed: boolean;
  updatedAt: string | null;
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

export class DeliverableReviewNotesApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'DeliverableReviewNotesApiError';
    this.code = code;
  }
}

async function parseError(response: Response): Promise<DeliverableReviewNotesApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // ignored
  }

  return new DeliverableReviewNotesApiError(
    payload?.code ?? 'FORBIDDEN',
    payload?.message ?? 'Request failed.',
  );
}

export async function getReviewNotes(
  accessToken: string,
  deliverableId: string,
): Promise<DeliverableReviewNotesResponse> {
  const response = await fetch(`${API_BASE_URL}/deliverables/${deliverableId}/review-notes`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as DeliverableReviewNotesResponse;
}

export async function saveReviewNotes(
  accessToken: string,
  deliverableId: string,
  notes: string,
): Promise<DeliverableReviewNotesResponse> {
  const response = await fetch(`${API_BASE_URL}/deliverables/${deliverableId}/review-notes`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as DeliverableReviewNotesResponse;
}
