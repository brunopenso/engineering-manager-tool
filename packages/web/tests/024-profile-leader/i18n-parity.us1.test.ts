import { describe, expect, it } from 'vitest';
import enProfile from '../../src/locales/en-US/profile.json';
import ptProfile from '../../src/locales/pt-BR/profile.json';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    collectKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

describe('024 profile leader i18n parity', () => {
  it('keeps profile field key parity between en-US and pt-BR', () => {
    const enKeys = collectKeys(enProfile.fields).sort();
    const ptKeys = collectKeys(ptProfile.fields).sort();
    expect(ptKeys).toEqual(enKeys);
  });

  it('defines leader label and empty-state copy in both locales', () => {
    expect(enProfile.fields.leader).toBe('Leader');
    expect(enProfile.fields.leaderNone).toBe('No leader assigned');
    expect(ptProfile.fields.leader).toBe('Líder');
    expect(ptProfile.fields.leaderNone).toBe('Nenhum líder atribuído');
  });
});
