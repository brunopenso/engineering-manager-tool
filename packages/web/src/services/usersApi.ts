import type { AuthUser } from '../auth/AuthProvider.js';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type ApiErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'MISSING_APP_TOKEN'
  | 'INVALID_APP_TOKEN';

export class UsersApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'UsersApiError';
    this.code = code;
  }
}

type ErrorResponse = {
  code: ApiErrorCode;
  message: string;
};

export type RoleChangeRequest = {
  role: 'LEADER' | 'ADMINISTRATOR';
  action: 'GRANT' | 'REVOKE';
};

export type LeaderCreateUserRequest = {
  fullName: string;
  email: string;
  role: string;
};

export type LeaderCreatedUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  leaderId: string;
  createdByUserId: string;
  createdAt: string;
};

export type AdminUserListFilters = {
  name?: string;
  email?: string;
  roles?: Array<'COLLABORATOR' | 'LEADER' | 'ADMINISTRATOR'>;
};

function buildAdminUserListQuery(filters?: AdminUserListFilters): string {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();
  const name = filters.name?.trim();
  if (name && name.length >= 3) {
    params.set('name', name);
  }

  const email = filters.email?.trim();
  if (email && email.length >= 3) {
    params.set('email', email);
  }

  if (filters.roles?.length) {
    for (const role of filters.roles) {
      params.append('roles', role);
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export type OrphanUserSummary = {
  id: string;
  fullName: string;
  email: string;
};

export type AssignLeaderResponse = {
  userId: string;
  leaderId: string;
  updatedAt: string;
};

export type HierarchyViewNode = {
  id: string;
  displayName: string;
  email: string;
  isLeader: boolean;
  isCurrentPosition?: boolean;
  children?: HierarchyViewNode[];
};

export type LeaderHierarchyViewResponse = {
  manager: HierarchyViewNode | null;
  self: HierarchyViewNode;
  reports: HierarchyViewNode[];
};

async function parseError(response: Response): Promise<UsersApiError> {
  let payload: ErrorResponse | null = null;

  try {
    payload = (await response.json()) as ErrorResponse;
  } catch {
    // fallback below
  }

  return new UsersApiError(
    payload?.code ?? 'FORBIDDEN',
    payload?.message ?? 'Request failed.',
  );
}

export async function listUsers(
  accessToken: string,
  filters?: AdminUserListFilters,
): Promise<AuthUser[]> {
  const querySuffix = buildAdminUserListQuery(filters);
  const response = await fetch(`${API_BASE_URL}/users${querySuffix}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { users: AuthUser[] };
  return payload.users;
}

export async function updateUserRole(
  accessToken: string,
  userId: string,
  change: RoleChangeRequest,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/roles`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(change),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { user: AuthUser };
  return payload.user;
}

export async function createUser(
  accessToken: string,
  input: LeaderCreateUserRequest,
): Promise<LeaderCreatedUser> {
  const response = await fetch(`${API_BASE_URL}/users`, {
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

  const payload = (await response.json()) as { user: LeaderCreatedUser };
  return payload.user;
}

export async function searchOrphanUsers(
  accessToken: string,
  query?: string,
): Promise<OrphanUserSummary[]> {
  const params = new URLSearchParams();
  if (query?.trim()) {
    params.set('query', query.trim());
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/users/orphans${suffix}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { users: OrphanUserSummary[] };
  return payload.users;
}

export async function fetchLeaderHierarchyView(
  accessToken: string,
): Promise<LeaderHierarchyViewResponse> {
  const response = await fetch(`${API_BASE_URL}/users/leader/hierarchy-view`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as LeaderHierarchyViewResponse;
}

export async function assignLeaderToUser(
  accessToken: string,
  userId: string,
): Promise<AssignLeaderResponse> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/assign-leader`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as AssignLeaderResponse;
}
