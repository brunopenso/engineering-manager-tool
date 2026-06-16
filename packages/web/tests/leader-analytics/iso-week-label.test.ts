import { describe, expect, it } from 'vitest';
import {
  buildAscendingIsoWeekAxis,
  formatIsoWeekLabel,
  sortWeekStartsAscending,
} from '../../src/utils/isoWeekLabel.js';

describe('isoWeekLabel', () => {
  it('formats Monday week start as ISO year-week', () => {
    expect(formatIsoWeekLabel('2026-04-06')).toBe('2026-W15');
  });

  it('sorts week starts ascending', () => {
    expect(sortWeekStartsAscending(['2026-05-11', '2026-04-06', '2026-04-13'])).toEqual([
      '2026-04-06',
      '2026-04-13',
      '2026-05-11',
    ]);
  });

  it('builds ordered labels for chart axis', () => {
    const axis = buildAscendingIsoWeekAxis(['2026-05-11', '2026-04-06']);

    expect(axis.weekStarts).toEqual(['2026-04-06', '2026-05-11']);
    expect(axis.labels[0]).toMatch(/^\d{4}-W\d{2}$/);
    expect(axis.labels[1]).toMatch(/^\d{4}-W\d{2}$/);
  });
});
