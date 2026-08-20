import { describe, expect, it } from 'vitest';
import enLeader from '../../src/locales/en-US/leader.json';
import ptLeader from '../../src/locales/pt-BR/leader.json';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    collectKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

describe('023 picker i18n parity', () => {
  it('keeps picker key parity between en-US and pt-BR', () => {
    const enKeys = collectKeys(enLeader.picker).sort();
    const ptKeys = collectKeys(ptLeader.picker).sort();
    expect(ptKeys).toEqual(enKeys);
  });

  it('defines Itself and scope labels', () => {
    expect(enLeader.picker.itself).toBeTruthy();
    expect(ptLeader.picker.itself).toBeTruthy();
    expect(enLeader.picker.scopeSubtree).toContain('{{name}}');
    expect(enLeader.picker.scopeItself).toContain('{{name}}');
  });
});
