export const AUTH_ERROR_CODES = {
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  ISSUER_MISMATCH: 'ISSUER_MISMATCH',
  AUDIENCE_MISMATCH: 'AUDIENCE_MISMATCH',
  MISSING_APP_TOKEN: 'MISSING_APP_TOKEN',
  INVALID_APP_TOKEN: 'INVALID_APP_TOKEN',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_TAG_NAME: 'DUPLICATE_TAG_NAME',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export const USER_ROLE_TYPES = {
  COLLABORATOR: 'COLLABORATOR',
  LEADER: 'LEADER',
  ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

export type UserRoleType = (typeof USER_ROLE_TYPES)[keyof typeof USER_ROLE_TYPES];

export const ELEVATED_ROLE_TYPES = [
  USER_ROLE_TYPES.LEADER,
  USER_ROLE_TYPES.ADMINISTRATOR,
] as const;

export type ElevatedRoleType = (typeof ELEVATED_ROLE_TYPES)[number];

export type RoleChangeAction = 'GRANT' | 'REVOKE';

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  firstLoginAt: string;
  lastLoginAt: string;
  roles: UserRoleType[];
};

export type AppTokenPayload = {
  sub: string;
  email: string;
  fullName: string;
};

export type AuthFailureResponse = {
  code: AuthErrorCode;
  message: string;
};

export type RequestAuthContext = {
  userId: string;
  email: string;
  fullName: string;
  roles: UserRoleType[];
};
