import { describe, expect, it } from 'vitest';
import { buildWeekStartsInRange } from '../../src/services/leaderAnalyticsService.js';

describe('US3 impact aggregation helpers', () => {
  it('builds week starts between range bounds', () => {
    const start = new Date('2026-05-01T12:00:00.000Z');
    const end = new Date('2026-05-20T12:00:00.000Z');
    const weeks = buildWeekStartsInRange(start, end);

    expect(weeks.length).toBeGreaterThanOrEqual(2);
    expect(weeks[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
