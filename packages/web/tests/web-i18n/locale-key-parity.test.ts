import { describe, expect, it } from 'vitest';
import { I18N_NAMESPACES } from '../../src/i18n/config.js';
import enUSCommon from '../../src/locales/en-US/common.json';
import enUSShell from '../../src/locales/en-US/shell.json';
import enUSAuth from '../../src/locales/en-US/auth.json';
import enUSProfile from '../../src/locales/en-US/profile.json';
import enUSDeliverables from '../../src/locales/en-US/deliverables.json';
import enUSLeader from '../../src/locales/en-US/leader.json';
import enUSAdmin from '../../src/locales/en-US/admin.json';
import ptBRCommon from '../../src/locales/pt-BR/common.json';
import ptBRShell from '../../src/locales/pt-BR/shell.json';
import ptBRAuth from '../../src/locales/pt-BR/auth.json';
import ptBRProfile from '../../src/locales/pt-BR/profile.json';
import ptBRDeliverables from '../../src/locales/pt-BR/deliverables.json';
import ptBRLeader from '../../src/locales/pt-BR/leader.json';
import ptBRAdmin from '../../src/locales/pt-BR/admin.json';

const enBundles = {
  common: enUSCommon,
  shell: enUSShell,
  auth: enUSAuth,
  profile: enUSProfile,
  deliverables: enUSDeliverables,
  leader: enUSLeader,
  admin: enUSAdmin,
};

const ptBundles = {
  common: ptBRCommon,
  shell: ptBRShell,
  auth: ptBRAuth,
  profile: ptBRProfile,
  deliverables: ptBRDeliverables,
  leader: ptBRLeader,
  admin: ptBRAdmin,
};

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === 'object' && !Array.isArray(nested)) {
      return flattenKeys(nested, next);
    }
    return [next];
  });
}

describe('US2 locale key parity', () => {
  for (const namespace of I18N_NAMESPACES) {
    it(`matches keys for namespace ${namespace}`, () => {
      const enKeys = flattenKeys(enBundles[namespace as keyof typeof enBundles]).sort();
      const ptKeys = flattenKeys(ptBundles[namespace as keyof typeof ptBundles]).sort();
      expect(ptKeys).toEqual(enKeys);
    });
  }
});
