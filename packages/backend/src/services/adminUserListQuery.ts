import { AUTH_ERROR_CODES, USER_ROLE_TYPES, type UserRoleType } from '../auth/types.js';
import type { AdminUserListFilters } from '../types/adminUserListFilters.js';

export const ADMIN_USER_TEXT_FILTER_MIN_LENGTH = 3;

export class AdminUserListValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = AUTH_ERROR_CODES.VALIDATION_ERROR;
  }
}

function normalizeQueryValues(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeSearchText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length < ADMIN_USER_TEXT_FILTER_MIN_LENGTH) {
    return undefined;
  }

  return trimmed;
}

function parseRoles(raw: string | string[] | undefined): UserRoleType[] | undefined {
  const values = normalizeQueryValues(raw)
    .map((item) => item.trim())
    .filter(Boolean);

  if (values.length === 0) {
    return undefined;
  }

  const allowed = new Set<string>(Object.values(USER_ROLE_TYPES));

  for (const value of values) {
    if (!allowed.has(value)) {
      throw new AdminUserListValidationError(`Invalid role filter: ${value}`);
    }
  }

  return [...new Set(values)] as UserRoleType[];
}

export function parseAdminUserListFilters(query: {
  name?: string;
  email?: string;
  roles?: string | string[];
}): AdminUserListFilters {
  const name = normalizeSearchText(query.name);
  const email = normalizeSearchText(query.email);
  const roles = parseRoles(query.roles);

  return {
    name,
    email,
    roles,
  };
}
