import { describe, expect, it } from 'vitest';
import {
  GithubPrImportDateRangeError,
  parseImportCliArgs,
  resolveImportDateRange,
} from '../../src/services/githubPrImportDateRange.js';

describe('CLI argument validation', () => {
  it('rejects unknown flags', () => {
    expect(() => parseImportCliArgs(['--org', 'acme'])).toThrow(GithubPrImportDateRangeError);
  });

  it('rejects providing only start or only end', () => {
    expect(() => resolveImportDateRange('2026-08-01', undefined)).toThrow(
      GithubPrImportDateRangeError,
    );
    expect(() => resolveImportDateRange(undefined, '2026-08-01')).toThrow(
      GithubPrImportDateRangeError,
    );
  });

  it('rejects end before start', () => {
    expect(() => resolveImportDateRange('2026-08-10', '2026-08-01')).toThrow(
      /endDate must be on or after startDate/,
    );
  });
});
