export type Tag = {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'MISSING_APP_TOKEN'
  | 'INVALID_APP_TOKEN'
  | 'DUPLICATE_TAG_NAME';

type ErrorResponse = {
  code: ApiErrorCode;
  message: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export class TagsApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'TagsApiError';
    this.code = code;
  }
}

type CreateTagInput = {
  name: string;
  color: string;
};

type UpdateTagInput = {
  name?: string;
  color?: string;
};

async function parseError(response: Response): Promise<TagsApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // ignored
  }

  return new TagsApiError(payload?.code ?? 'FORBIDDEN', payload?.message ?? 'Request failed.');
}

export async function fetchTagCatalog(accessToken: string): Promise<Tag[]> {
  const response = await fetch(`${API_BASE_URL}/tags/catalog`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { tags: Tag[] };
  return payload.tags;
}

export async function listTags(accessToken: string): Promise<Tag[]> {
  const response = await fetch(`${API_BASE_URL}/tags`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { tags: Tag[] };
  return payload.tags;
}

export async function createTag(accessToken: string, input: CreateTagInput): Promise<Tag> {
  const response = await fetch(`${API_BASE_URL}/tags`, {
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

  const payload = (await response.json()) as { tag: Tag };
  return payload.tag;
}

export async function updateTag(
  accessToken: string,
  tagId: string,
  input: UpdateTagInput,
): Promise<Tag> {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
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

  const payload = (await response.json()) as { tag: Tag };
  return payload.tag;
}

export async function deleteTag(accessToken: string, tagId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }
}
