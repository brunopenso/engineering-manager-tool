import type { Tag } from './tagsApi.js';

export type BusinessImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'TRANSFORMATIONAL';

export type DeliverableSummary = {
  id: string;
  ownerUserId: string;
  title: string;
  businessImpact: BusinessImpact;
  systemTags: Tag[];
  updatedAt: string;
};

export type DeliverableDetail = DeliverableSummary & {
  description: string;
  roleInDeliverable: string;
  improvementPoints: string;
  technicalDescription: string | null;
  userTags: string[];
  links: { url: string; label: string | null }[];
  createdAt: string;
};

export type DeliverableWriteInput = {
  title: string;
  description: string;
  roleInDeliverable: string;
  systemTagIds: string[];
  businessImpact: BusinessImpact;
  improvementPoints: string;
  technicalDescription?: string | null;
  userTags?: string[];
  links?: { url: string; label?: string | null }[];
};

type ApiErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INVALID_SYSTEM_TAG'
  | 'DELIVERABLE_FORBIDDEN'
  | 'MISSING_APP_TOKEN'
  | 'INVALID_APP_TOKEN';

type ErrorResponse = {
  code: ApiErrorCode;
  message: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export class DeliverablesApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'DeliverablesApiError';
    this.code = code;
  }
}

async function parseError(response: Response): Promise<DeliverablesApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // ignored
  }

  return new DeliverablesApiError(
    payload?.code ?? 'FORBIDDEN',
    payload?.message ?? 'Request failed.',
  );
}

export async function listMyDeliverables(accessToken: string): Promise<DeliverableSummary[]> {
  const response = await fetch(`${API_BASE_URL}/deliverables`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { deliverables: DeliverableSummary[] };
  return payload.deliverables;
}

export async function listUserDeliverables(
  accessToken: string,
  userId: string,
): Promise<{ ownerUserId: string; readOnly: boolean; deliverables: DeliverableSummary[] }> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/deliverables`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as {
    ownerUserId: string;
    readOnly: boolean;
    deliverables: DeliverableSummary[];
  };
}

export async function getDeliverable(
  accessToken: string,
  deliverableId: string,
): Promise<{ readOnly: boolean; deliverable: DeliverableDetail }> {
  const response = await fetch(`${API_BASE_URL}/deliverables/${deliverableId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as { readOnly: boolean; deliverable: DeliverableDetail };
}

export async function createDeliverable(
  accessToken: string,
  input: DeliverableWriteInput,
): Promise<DeliverableDetail> {
  const response = await fetch(`${API_BASE_URL}/deliverables`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { deliverable: DeliverableDetail };
  return payload.deliverable;
}

export async function updateDeliverable(
  accessToken: string,
  deliverableId: string,
  input: DeliverableWriteInput & { userTags: string[]; links: { url: string; label?: string | null }[] },
): Promise<DeliverableDetail> {
  const response = await fetch(`${API_BASE_URL}/deliverables/${deliverableId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { deliverable: DeliverableDetail };
  return payload.deliverable;
}

export async function deleteDeliverable(accessToken: string, deliverableId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/deliverables/${deliverableId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }
}
