import { describe, expect, it } from 'vitest';
import { validateDateRange } from '../../src/services/teamDeliverablesDate.js';

describe('team deliverables date utilities', () => {
  it('includes boundary days inclusively', () => {
    const { start, end } = validateDateRange('2026-05-01', '2026-05-31');

    expect(start.toISOString()).toBe('2026-05-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-05-31T23:59:59.999Z');
  });

  it('rejects end before start', () => {
    expect(() => validateDateRange('2026-05-10', '2026-05-01')).toThrow(
      /endDate must be on or after startDate/i,
    );
  });
});
