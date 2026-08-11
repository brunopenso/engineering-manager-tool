import { formatIsoWeekLabel } from './isoWeekLabel.js';
import type { MyActivityPullRequest } from '../services/myPullRequestsApi.js';

export type RepositoryOption = {
  key: string;
  label: string;
  organization: string;
  repository: string;
  repositoryId: string;
};

export type AuthoredWeekBucket = {
  weekStart: string;
  label: string;
  count: number;
};

function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

/** Monday UTC week start (YYYY-MM-DD) for a mergedAt ISO timestamp. */
export function weekStartMondayUtc(mergedAtIso: string): string {
  const date = new Date(mergedAtIso);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() + mondayOffset);
  return monday.toISOString().slice(0, 10);
}

export function repositoryKey(
  pr: Pick<MyActivityPullRequest, 'organization' | 'repository'>,
): string {
  return `${pr.organization}/${pr.repository}`;
}

export function deriveRepositoryOptions(pullRequests: MyActivityPullRequest[]): RepositoryOption[] {
  const map = new Map<string, RepositoryOption>();
  for (const pr of pullRequests) {
    const key = repositoryKey(pr);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: key,
        organization: pr.organization,
        repository: pr.repository,
        repositoryId: pr.repositoryId,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function filterByRepository(
  pullRequests: MyActivityPullRequest[],
  repositoryFilterKey: string | null,
): MyActivityPullRequest[] {
  if (!repositoryFilterKey) {
    return pullRequests;
  }
  return pullRequests.filter((pr) => repositoryKey(pr) === repositoryFilterKey);
}

export function buildAuthoredWeeklySeries(
  pullRequests: MyActivityPullRequest[],
  range: { startDate: string; endDate: string },
): AuthoredWeekBucket[] {
  const authored = pullRequests.filter((pr) => pr.involvementRole === 'owner');
  const counts = new Map<string, number>();

  for (const pr of authored) {
    const week = weekStartMondayUtc(pr.mergedAt);
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }

  const weeks = enumerateWeekStarts(range.startDate, range.endDate);
  return weeks.map((weekStart) => ({
    weekStart,
    label: formatIsoWeekLabel(weekStart),
    count: counts.get(weekStart) ?? 0,
  }));
}

export function enumerateWeekStarts(startDate: string, endDate: string): string[] {
  const first = weekStartMondayUtc(`${startDate}T12:00:00.000Z`);
  const last = weekStartMondayUtc(`${endDate}T12:00:00.000Z`);
  const weeks: string[] = [];
  let cursor = new Date(`${first}T00:00:00.000Z`);
  const end = new Date(`${last}T00:00:00.000Z`);
  while (cursor <= end) {
    weeks.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return weeks;
}

export function countActorComments(
  pullRequests: MyActivityPullRequest[],
  actorGithubLogin: string,
): number {
  const login = normalizeLogin(actorGithubLogin);
  return pullRequests.reduce(
    (sum, pr) =>
      sum + pr.comments.filter((c) => normalizeLogin(c.authorGithubLogin) === login).length,
    0,
  );
}

export function countActorReviews(
  pullRequests: MyActivityPullRequest[],
  actorGithubLogin: string,
): number {
  const login = normalizeLogin(actorGithubLogin);
  return pullRequests.reduce(
    (sum, pr) =>
      sum + pr.reviews.filter((r) => normalizeLogin(r.reviewerGithubLogin) === login).length,
    0,
  );
}

export function sortByMergedAtDesc(pullRequests: MyActivityPullRequest[]): MyActivityPullRequest[] {
  return [...pullRequests].sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
}
