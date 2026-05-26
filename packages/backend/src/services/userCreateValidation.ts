import { AUTH_ERROR_CODES } from '../auth/types.js';

export type LeaderCreateUserInput = {
  fullName?: string;
  email?: string;
  role?: string;
  leaderId?: string | null;
};

export class UserCreateValidationError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'UserCreateValidationError';
    this.code = AUTH_ERROR_CODES.VALIDATION_ERROR;
  }
}

export function normalizeLeaderCreateInput(input: LeaderCreateUserInput): {
  fullName: string;
  email: string;
  role: string;
} {
  const fullName = input.fullName?.trim() ?? '';
  const email = input.email?.trim().toLowerCase() ?? '';
  const role = input.role?.trim().toUpperCase() ?? '';

  if (!fullName) {
    throw new UserCreateValidationError('Full name is required.');
  }

  if (!email) {
    throw new UserCreateValidationError('Email is required.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new UserCreateValidationError('Email must be valid.');
  }

  if (!role) {
    throw new UserCreateValidationError('Role is required.');
  }

  return { fullName, email, role };
}
