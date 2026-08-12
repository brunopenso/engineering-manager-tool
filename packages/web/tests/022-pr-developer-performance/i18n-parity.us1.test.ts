import { describe, expect, it } from 'vitest';
import enShell from '../../src/locales/en-US/shell.json';
import ptShell from '../../src/locales/pt-BR/shell.json';
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

describe('US1 i18n parity for team PR performance', () => {
  it('keeps shell menu key in both locales', () => {
    expect(enShell.menu.teamPrPerformance).toBeTruthy();
    expect(ptShell.menu.teamPrPerformance).toBeTruthy();
  });

  it('keeps teamPrPerformance key parity between en-US and pt-BR', () => {
    const enKeys = collectKeys(enLeader.teamPrPerformance).sort();
    const ptKeys = collectKeys(ptLeader.teamPrPerformance).sort();
    expect(ptKeys).toEqual(enKeys);
  });
});
