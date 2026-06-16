import { describe, expect, it } from 'vitest';
import { formatDisplayNumber } from '../../src/utils/formatDisplayNumber.js';

describe('US4 formatDisplayNumber', () => {
  it('uses US grouping for en-US', () => {
    expect(formatDisplayNumber(1234567.89, 'en-US')).toBe('1,234,567.89');
  });

  it('uses Brazilian grouping for pt-BR', () => {
    expect(formatDisplayNumber(1234567.89, 'pt-BR')).toBe('1.234.567,89');
  });
});
