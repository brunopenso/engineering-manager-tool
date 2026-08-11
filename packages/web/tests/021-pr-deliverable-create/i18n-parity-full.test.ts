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

describe('021 createDeliverable full i18n parity', () => {
  it('matches all createDeliverable nested keys between locales', () => {
    expect(flattenKeys(pt.createDeliverable).sort()).toEqual(
      flattenKeys(en.createDeliverable).sort(),
    );
  });
});
