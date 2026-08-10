import { describe, expect, it } from 'vitest';
import {
  GithubPrImportDateRangeError,
  parseImportCliArgs,
  previousUtcCalendarDay,
  resolveImportDateRange,
} from '../../src/services/githubPrImportDateRange.js';

describe('US1 import date range', () => {
  it('defaults to previous UTC calendar day', () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    expect(previousUtcCalendarDay(now)).toBe('2026-08-09');
    expect(resolveImportDateRange(undefined, undefined, now)).toEqual({
      startDate: '2026-08-09',
      endDate: '2026-08-09',
    });
  });

  it('accepts explicit inclusive start and end', () => {
    expect(resolveImportDateRange('2026-08-01', '2026-08-03')).toEqual({
      startDate: '2026-08-01',
      endDate: '2026-08-03',
    });
  });

  it('rejects one-sided dates and inverted ranges', () => {
    expect(() => resolveImportDateRange('2026-08-01', undefined)).toThrow(
      GithubPrImportDateRangeError,
    );
    expect(() => resolveImportDateRange('2026-08-05', '2026-08-01')).toThrow(
      GithubPrImportDateRangeError,
    );
  });

  it('parses CLI flags', () => {
    expect(parseImportCliArgs(['--start', '2026-08-09', '--end', '2026-08-09'])).toEqual({
      startDate: '2026-08-09',
      endDate: '2026-08-09',
      help: false,
    });
  });
});
