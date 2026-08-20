import { User } from '../database/entities/User.js';
import { AppDataSource } from '../database/connection.js';
import type { UserRoleType } from '../auth/types.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
  type DateFormatPreference,
  type LanguagePreference,
} from '../types/profilePreferences.js';
import { loadRolesForUser } from './roleService.js';

export type LeaderSummary = {
  id: string;
  fullName: string;
};

export type AuthUserResponse = {
  id: string;
  email: string;
  fullName: string;
  firstLoginAt: string;
  lastLoginAt: string;
  roles: UserRoleType[];
  themePreference: 'light' | 'dark';
  githubLogin: string | null;
  languagePreference: LanguagePreference;
  dateFormatPreference: DateFormatPreference;
  leader: LeaderSummary | null;
};

async function loadLeaderSummary(user: User): Promise<LeaderSummary | null> {
  if (user.leader) {
    return { id: user.leader.id, fullName: user.leader.fullName };
  }

  const leaderId = user.leaderId;
  if (!leaderId) {
    return null;
  }

  const leader = await AppDataSource.getRepository(User).findOne({
    where: { id: leaderId },
    select: { id: true, fullName: true },
  });

  if (!leader) {
    return null;
  }

  return { id: leader.id, fullName: leader.fullName };
}

export async function mapUserToAuthResponse(user: User): Promise<AuthUserResponse> {
  const [roles, leader] = await Promise.all([loadRolesForUser(user.id), loadLeaderSummary(user)]);

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    firstLoginAt: user.firstLoginAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
    roles,
    themePreference: user.themePreference ?? 'light',
    githubLogin: user.githubLogin ?? null,
    languagePreference: user.languagePreference ?? DEFAULT_LANGUAGE_PREFERENCE,
    dateFormatPreference: user.dateFormatPreference ?? DEFAULT_DATE_FORMAT_PREFERENCE,
    leader,
  };
}
