import { describe, expect, it } from 'vitest';
import enShell from '../../src/locales/en-US/shell.json';
import ptShell from '../../src/locales/pt-BR/shell.json';
import enPr from '../../src/locales/en-US/prActivity.json';
import ptPr from '../../src/locales/pt-BR/prActivity.json';
import { I18N_NAMESPACES } from '../../src/i18n/config.js';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    collectKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

describe('US1 i18n parity for pr activity', () => {
  it('registers prActivity namespace', () => {
    expect(I18N_NAMESPACES).toContain('prActivity');
  });

  it('keeps shell menu key in both locales', () => {
    expect(enShell.menu.myPullRequests).toBeTruthy();
    expect(ptShell.menu.myPullRequests).toBeTruthy();
  });

  it('keeps prActivity key parity between en-US and pt-BR', () => {
    const enKeys = collectKeys(enPr).sort();
    const ptKeys = collectKeys(ptPr).sort();
    expect(ptKeys).toEqual(enKeys);
  });
});
