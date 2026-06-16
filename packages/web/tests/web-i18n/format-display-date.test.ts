import { describe, expect, it } from 'vitest';
import {
  formatDisplayDate,
  formatDisplayDateTime,
} from '../../src/utils/formatDisplayDate.js';

describe('US4 formatDisplayDate', () => {
  const sample = new Date('2026-05-15T14:30:00');

  it('formats MDY order', () => {
    expect(formatDisplayDate(sample, 'MDY', 'en-US')).toBe('05/15/2026');
  });

  it('formats DMY order', () => {
    expect(formatDisplayDate(sample, 'DMY', 'en-US')).toBe('15/05/2026');
  });

  it('formats YMD order', () => {
    expect(formatDisplayDate(sample, 'YMD', 'en-US')).toBe('2026/05/15');
  });

  it('includes time in formatDisplayDateTime', () => {
    expect(formatDisplayDateTime(sample, 'DMY', 'en-US')).toMatch(/^15\/05\/2026 /);
  });

  it('formats ISO date-only strings without timezone shift', () => {
    expect(formatDisplayDate('2026-05-15', 'DMY', 'en-US')).toBe('15/05/2026');
  });
});
