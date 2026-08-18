import { AppDataSource } from '../database/connection.js';
import {
  BUSINESS_IMPACT_LEVELS,
  type BusinessImpactLevel,
  type EngagementBucketRow,
  type ImpactBucketRow,
  type PendingReviewByImpactRow,
  type TeamAnalyticsFilters,
  type TeamAnalyticsResponse,
} from '../types/leaderAnalytics.js';
import { resolveScopedOwnerUserIds, toHierarchyDisplayName } from './userService.js';
import { validateDateRange } from './teamDeliverablesDate.js';

type ImpactAggregateRow = {
  week_start: string;
  impact: string;
  count: string;
};

type EngagementAggregateRow = {
  week_start: string;
  user_id: string;
  full_name: string;
  email: string;
  count: string;
};

type PendingReviewByImpactAggregateRow = {
  impact: string;
  count: string;
};

function formatWeekStart(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeekUtc(date: Date): Date {
  const normalized = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = normalized.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setUTCDate(normalized.getUTCDate() + diff);
  return normalized;
}

export function buildWeekStartsInRange(start: Date, end: Date): string[] {
  const weeks: string[] = [];
  const cursor = startOfWeekUtc(start);
  const endWeek = startOfWeekUtc(end);

  while (cursor.getTime() <= endWeek.getTime()) {
    weeks.push(formatWeekStart(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return weeks;
}

async function resolveOwnerUserIds(
  actorUserId: string,
  userId?: string,
  scope?: TeamAnalyticsFilters['scope'],
): Promise<{ ownerUserIds: string[]; filteredUserId?: string; scope?: TeamAnalyticsFilters['scope'] }> {
  return resolveScopedOwnerUserIds(actorUserId, userId, scope);
}

function mapImpactRows(rows: ImpactAggregateRow[]): ImpactBucketRow[] {
  return rows.map((row) => ({
    weekStart: row.week_start,
    impact: row.impact as BusinessImpactLevel,
    count: Number.parseInt(row.count, 10),
  }));
}

function mapEngagementRows(rows: EngagementAggregateRow[]): EngagementBucketRow[] {
  return rows.map((row) => ({
    weekStart: row.week_start,
    userId: row.user_id,
    displayName: toHierarchyDisplayName(row.full_name, row.email),
    count: Number.parseInt(row.count, 10),
  }));
}

function buildPendingReviewByImpact(
  rows: PendingReviewByImpactAggregateRow[],
): PendingReviewByImpactRow[] {
  const counts = new Map<BusinessImpactLevel, number>();

  for (const impact of BUSINESS_IMPACT_LEVELS) {
    counts.set(impact, 0);
  }

  for (const row of rows) {
    const impact = row.impact as BusinessImpactLevel;
    if (counts.has(impact)) {
      counts.set(impact, Number.parseInt(row.count, 10));
    }
  }

  return BUSINESS_IMPACT_LEVELS.map((impact) => ({
    impact,
    count: counts.get(impact) ?? 0,
  }));
}

export async function getLeaderTeamAnalytics(
  actorUserId: string,
  filters: TeamAnalyticsFilters,
): Promise<TeamAnalyticsResponse> {
  const { start, end } = validateDateRange(filters.startDate, filters.endDate);
  const { ownerUserIds, filteredUserId, scope } = await resolveOwnerUserIds(
    actorUserId,
    filters.userId,
    filters.scope,
  );
  const weekStarts = buildWeekStartsInRange(start, end);

  if (ownerUserIds.length === 0) {
    return {
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...(filteredUserId ? { userId: filteredUserId } : {}),
      ...(scope ? { scope } : {}),
      weekStarts,
      deliverablesByWeekAndImpact: [],
      engagementByWeek: [],
      pendingReviewCount: 0,
      pendingReviewByImpact: BUSINESS_IMPACT_LEVELS.map((impact) => ({ impact, count: 0 })),
    };
  }

  const impactRows = await AppDataSource.query<ImpactAggregateRow[]>(
    `
    SELECT
      to_char(date_trunc('week', d.created_at)::date, 'YYYY-MM-DD') AS week_start,
      d.business_impact AS impact,
      COUNT(*)::text AS count
    FROM deliverables d
    WHERE d.user_id = ANY($1::uuid[])
      AND d.created_at >= $2
      AND d.created_at <= $3
      AND d.business_impact = ANY($4::text[])
    GROUP BY week_start, d.business_impact
    ORDER BY week_start ASC, d.business_impact ASC
    `,
    [ownerUserIds, start, end, [...BUSINESS_IMPACT_LEVELS]],
  );

  const engagementRows = await AppDataSource.query<EngagementAggregateRow[]>(
    `
    SELECT
      to_char(date_trunc('week', d.created_at)::date, 'YYYY-MM-DD') AS week_start,
      d.user_id,
      u.full_name,
      u.email,
      COUNT(*)::text AS count
    FROM deliverables d
    INNER JOIN users u ON u.id = d.user_id
    WHERE d.user_id = ANY($1::uuid[])
      AND d.created_at >= $2
      AND d.created_at <= $3
    GROUP BY week_start, d.user_id, u.full_name, u.email
    ORDER BY week_start ASC, u.full_name ASC
    `,
    [ownerUserIds, start, end],
  );

  const pendingByImpactRows = await AppDataSource.query<PendingReviewByImpactAggregateRow[]>(
    `
    SELECT
      d.business_impact AS impact,
      COUNT(*)::text AS count
    FROM deliverables d
    LEFT JOIN deliverable_reviews r
      ON r.deliverable_id = d.id
      AND r.reviewer_user_id = $4
      AND r.reviewed = true
    WHERE d.user_id = ANY($1::uuid[])
      AND d.created_at >= $2
      AND d.created_at <= $3
      AND r.id IS NULL
      AND d.business_impact = ANY($5::text[])
    GROUP BY d.business_impact
    ORDER BY d.business_impact ASC
    `,
    [ownerUserIds, start, end, actorUserId, [...BUSINESS_IMPACT_LEVELS]],
  );

  const pendingReviewByImpact = buildPendingReviewByImpact(pendingByImpactRows);
  const pendingReviewCount = pendingReviewByImpact.reduce((sum, row) => sum + row.count, 0);

  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filteredUserId ? { userId: filteredUserId } : {}),
    ...(scope ? { scope } : {}),
    weekStarts,
    deliverablesByWeekAndImpact: mapImpactRows(impactRows),
    engagementByWeek: mapEngagementRows(engagementRows),
    pendingReviewCount,
    pendingReviewByImpact,
  };
}
