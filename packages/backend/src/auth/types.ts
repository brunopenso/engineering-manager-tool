export const AUTH_ERROR_CODES = {
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  ISSUER_MISMATCH: 'ISSUER_MISMATCH',
  AUDIENCE_MISMATCH: 'AUDIENCE_MISMATCH',
  MISSING_APP_TOKEN: 'MISSING_APP_TOKEN',
  INVALID_APP_TOKEN: 'INVALID_APP_TOKEN',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  firstLoginAt: string;
  lastLoginAt: string;
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
