import { AppDataSource } from '../database/connection.js';
import {
  PR_PERFORMANCE_CLASSIFICATIONS,
  type DeveloperPrDrilldownItem,
  type DeveloperPrDrilldownResponse,
  type DeveloperPrPerformanceRow,
  type PerformanceTotals,
  type PrPerformanceClassification,
  type TeamPrPerformanceFilters,
  type TeamPrPerformanceResponse,
  type WeeklyClassificationBucketRow,
} from '../types/leaderPrPerformance.js';
import { buildWeekStartsInRange } from './leaderAnalyticsService.js';
import {
  assertUserInLeaderSubtree,
  getLeaderTeamMembers,
  toHierarchyDisplayName,
} from './userService.js';
import { validateDateRange } from './teamDeliverablesDate.js';

type DeveloperUserRow = {
  id: string;
  full_name: string;
  email: string;
  github_login: string | null;
};

type CountByUserRow = {
  user_id: string;
  count: string;
};

type WeeklyClassificationAggregateRow = {
  week_start: string;
  classification: string;
  count: string;
};

async function resolveOwnerUserIds(
  actorUserId: string,
  userId?: string,
): Promise<{ ownerUserIds: string[]; filteredUserId?: string }> {
  if (userId) {
    return { ownerUserIds: [userId], filteredUserId: userId };
  }

  const { members } = await getLeaderTeamMembers(actorUserId);
  return { ownerUserIds: members.map((member) => member.id) };
}

function emptyTotals(): PerformanceTotals {
  return {
    authoredPullRequestCount: 0,
    commentCount: 0,
    reviewCount: 0,
  };
}

function emptyResponse(
  filters: TeamPrPerformanceFilters,
  weekStarts: string[],
  filteredUserId?: string,
): TeamPrPerformanceResponse {
  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filteredUserId ? { userId: filteredUserId } : {}),
    totals: emptyTotals(),
    developers: [],
    weekStarts,
    authoredByWeekAndClassification: [],
  };
}

function toCountMap(rows: CountByUserRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.user_id, Number.parseInt(row.count, 10));
  }
  return map;
}

export function normalizeClassification(value: string): PrPerformanceClassification {
  if ((PR_PERFORMANCE_CLASSIFICATIONS as readonly string[]).includes(value)) {
    return value as PrPerformanceClassification;
  }
  return 'unclassified';
}

export function resolveEffectiveClassification(
  userReclassification: string | null | undefined,
  classificationType: string | null | undefined,
): PrPerformanceClassification {
  return normalizeClassification(userReclassification ?? classificationType ?? 'unclassified');
}

export function sortDevelopersByAuthoredThenName(
  rows: DeveloperPrPerformanceRow[],
): DeveloperPrPerformanceRow[] {
  return [...rows].sort((a, b) => {
    if (b.authoredPullRequestCount !== a.authoredPullRequestCount) {
      return b.authoredPullRequestCount - a.authoredPullRequestCount;
    }
    return a.displayName.localeCompare(b.displayName);
  });
}

function mapWeeklyRows(rows: WeeklyClassificationAggregateRow[]): WeeklyClassificationBucketRow[] {
  return rows.map((row) => ({
    weekStart: row.week_start,
    classification: normalizeClassification(row.classification),
    count: Number.parseInt(row.count, 10),
  }));
}

export async function getLeaderTeamPrPerformance(
  actorUserId: string,
  filters: TeamPrPerformanceFilters,
): Promise<TeamPrPerformanceResponse> {
  const { start, end } = validateDateRange(filters.startDate, filters.endDate);
  const { ownerUserIds, filteredUserId } = await resolveOwnerUserIds(actorUserId, filters.userId);
  const weekStarts = buildWeekStartsInRange(start, end);

  if (ownerUserIds.length === 0) {
    return emptyResponse(filters, weekStarts, filteredUserId);
  }

  const developers = await AppDataSource.query<DeveloperUserRow[]>(
    `
    SELECT id, full_name, email, github_login
    FROM users
    WHERE id = ANY($1::uuid[])
    `,
    [ownerUserIds],
  );

  const authoredRows = await AppDataSource.query<CountByUserRow[]>(
    `
    SELECT
      u.id AS user_id,
      COUNT(pr.id)::text AS count
    FROM users u
    LEFT JOIN github_imported_pull_requests pr
      ON u.github_login IS NOT NULL
      AND LOWER(pr.author_github_login) = LOWER(u.github_login)
      AND pr.merged_at >= $2
      AND pr.merged_at <= $3
    WHERE u.id = ANY($1::uuid[])
    GROUP BY u.id
    `,
    [ownerUserIds, start, end],
  );

  const commentRows = await AppDataSource.query<CountByUserRow[]>(
    `
    SELECT
      u.id AS user_id,
      COUNT(filtered.id)::text AS count
    FROM users u
    LEFT JOIN (
      SELECT c.id, c.author_github_login
      FROM github_pull_request_comments c
      INNER JOIN github_imported_pull_requests pr ON pr.id = c.pull_request_id
      WHERE pr.merged_at >= $2
        AND pr.merged_at <= $3
    ) filtered
      ON u.github_login IS NOT NULL
      AND LOWER(filtered.author_github_login) = LOWER(u.github_login)
    WHERE u.id = ANY($1::uuid[])
    GROUP BY u.id
    `,
    [ownerUserIds, start, end],
  );

  const reviewRows = await AppDataSource.query<CountByUserRow[]>(
    `
    SELECT
      u.id AS user_id,
      COUNT(filtered.id)::text AS count
    FROM users u
    LEFT JOIN (
      SELECT r.id, r.reviewer_github_login
      FROM github_pull_request_reviews r
      INNER JOIN github_imported_pull_requests pr ON pr.id = r.pull_request_id
      WHERE pr.merged_at >= $2
        AND pr.merged_at <= $3
    ) filtered
      ON u.github_login IS NOT NULL
      AND LOWER(filtered.reviewer_github_login) = LOWER(u.github_login)
    WHERE u.id = ANY($1::uuid[])
    GROUP BY u.id
    `,
    [ownerUserIds, start, end],
  );

  const weeklyRows = await AppDataSource.query<WeeklyClassificationAggregateRow[]>(
    `
    SELECT
      to_char(date_trunc('week', pr.merged_at)::date, 'YYYY-MM-DD') AS week_start,
      COALESCE(pr.user_reclassification, pr.classification_type, 'unclassified') AS classification,
      COUNT(*)::text AS count
    FROM github_imported_pull_requests pr
    INNER JOIN users u
      ON u.github_login IS NOT NULL
      AND LOWER(pr.author_github_login) = LOWER(u.github_login)
    WHERE u.id = ANY($1::uuid[])
      AND pr.merged_at >= $2
      AND pr.merged_at <= $3
    GROUP BY week_start, classification
    ORDER BY week_start ASC, classification ASC
    `,
    [ownerUserIds, start, end],
  );

  const authoredByUser = toCountMap(authoredRows);
  const commentsByUser = toCountMap(commentRows);
  const reviewsByUser = toCountMap(reviewRows);

  const developerRows: DeveloperPrPerformanceRow[] = developers.map((user) => ({
    userId: user.id,
    displayName: toHierarchyDisplayName(user.full_name, user.email),
    email: user.email,
    githubLogin: user.github_login,
    authoredPullRequestCount: authoredByUser.get(user.id) ?? 0,
    commentCount: commentsByUser.get(user.id) ?? 0,
    reviewCount: reviewsByUser.get(user.id) ?? 0,
  }));

  const sortedDevelopers = sortDevelopersByAuthoredThenName(developerRows);
  const totals: PerformanceTotals = sortedDevelopers.reduce(
    (acc, row) => ({
      authoredPullRequestCount: acc.authoredPullRequestCount + row.authoredPullRequestCount,
      commentCount: acc.commentCount + row.commentCount,
      reviewCount: acc.reviewCount + row.reviewCount,
    }),
    emptyTotals(),
  );

  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filteredUserId ? { userId: filteredUserId } : {}),
    totals,
    developers: sortedDevelopers,
    weekStarts,
    authoredByWeekAndClassification: mapWeeklyRows(weeklyRows),
  };
}

type DrilldownPrRow = {
  id: string;
  title: string;
  repository: string;
  merged_at: Date;
  author_github_login: string;
  url: string | null;
  classification_type: string | null;
  user_reclassification: string | null;
  actor_comment_count: string;
  actor_review_count: string;
};

export async function getLeaderDeveloperPrDrilldown(
  actorUserId: string,
  developerUserId: string,
  filters: { startDate: string; endDate: string },
): Promise<DeveloperPrDrilldownResponse> {
  await assertUserInLeaderSubtree(actorUserId, developerUserId);
  const { start, end } = validateDateRange(filters.startDate, filters.endDate);

  const users = await AppDataSource.query<DeveloperUserRow[]>(
    `
    SELECT id, full_name, email, github_login
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [developerUserId],
  );
  const developer = users[0];

  if (!developer?.github_login) {
    return {
      userId: developerUserId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      pullRequests: [],
    };
  }

  const login = developer.github_login;
  const rows = await AppDataSource.query<DrilldownPrRow[]>(
    `
    SELECT
      pr.id,
      pr.title,
      pr.repository,
      pr.merged_at,
      pr.author_github_login,
      pr.url,
      pr.classification_type,
      pr.user_reclassification,
      (
        SELECT COUNT(*)::text
        FROM github_pull_request_comments c
        WHERE c.pull_request_id = pr.id
          AND LOWER(c.author_github_login) = LOWER($4)
      ) AS actor_comment_count,
      (
        SELECT COUNT(*)::text
        FROM github_pull_request_reviews r
        WHERE r.pull_request_id = pr.id
          AND LOWER(r.reviewer_github_login) = LOWER($4)
      ) AS actor_review_count
    FROM github_imported_pull_requests pr
    WHERE pr.merged_at >= $2
      AND pr.merged_at <= $3
      AND (
        LOWER(pr.author_github_login) = LOWER($4)
        OR EXISTS (
          SELECT 1
          FROM github_pull_request_comments c
          WHERE c.pull_request_id = pr.id
            AND LOWER(c.author_github_login) = LOWER($4)
        )
        OR EXISTS (
          SELECT 1
          FROM github_pull_request_reviews r
          WHERE r.pull_request_id = pr.id
            AND LOWER(r.reviewer_github_login) = LOWER($4)
        )
      )
    ORDER BY pr.merged_at DESC
    `,
    [developerUserId, start, end, login],
  );

  const pullRequests: DeveloperPrDrilldownItem[] = rows.map((row) => {
    const isOwner = row.author_github_login.toLowerCase() === login.toLowerCase();
    return {
      id: row.id,
      title: row.title,
      repository: row.repository,
      mergedAt: new Date(row.merged_at).toISOString(),
      involvementRole: isOwner ? 'owner' : 'involved',
      effectiveClassification: resolveEffectiveClassification(
        row.user_reclassification,
        row.classification_type,
      ),
      url: row.url,
      actorCommentCount: Number.parseInt(row.actor_comment_count, 10),
      actorReviewCount: Number.parseInt(row.actor_review_count, 10),
    };
  });

  return {
    userId: developerUserId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    pullRequests,
  };
}
