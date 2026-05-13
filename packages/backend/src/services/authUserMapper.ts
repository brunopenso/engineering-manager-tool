import { User } from '../database/entities/User.js';

export type AuthUserResponse = {
  id: string;
  email: string;
  fullName: string;
  firstLoginAt: string;
  lastLoginAt: string;
};

export function mapUserToAuthResponse(user: User): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    firstLoginAt: user.firstLoginAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
  };
}