import { describe, expect, it } from 'vitest';
import en from '../../src/locales/en-US/prActivity.json';
import pt from '../../src/locales/pt-BR/prActivity.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

describe('021 createDeliverable i18n parity (US1)', () => {
  it('has matching createDeliverable keys in en-US and pt-BR', () => {
    const enKeys = flattenKeys(en.createDeliverable).sort();
    const ptKeys = flattenKeys(pt.createDeliverable).sort();
    expect(ptKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(0);
  });
});
