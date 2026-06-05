/**
 * Formats a Monday UTC week-start date (YYYY-MM-DD) as ISO 8601 year-week (e.g. 2026-W15).
 */
export function formatIsoWeekLabel(weekStartMonday: string): string {
  const [year, month, day] = weekStartMonday.split('-').map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));

  // ISO week-year is the year of the Thursday in this week
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7) + 3);

  const isoYear = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const dayOffset =
    (thursday.getTime() - jan4.getTime()) / 86_400_000 -
    3 +
    ((jan4.getUTCDay() + 6) % 7);
  const isoWeek = 1 + Math.floor(dayOffset / 7);

  return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
}

export function sortWeekStartsAscending(weekStarts: string[]): string[] {
  return [...weekStarts].sort((left, right) => left.localeCompare(right));
}

export function buildAscendingIsoWeekAxis(weekStarts: string[]): {
  weekStarts: string[];
  labels: string[];
} {
  const ordered = sortWeekStartsAscending(weekStarts);

  return {
    weekStarts: ordered,
    labels: ordered.map(formatIsoWeekLabel),
  };
}
