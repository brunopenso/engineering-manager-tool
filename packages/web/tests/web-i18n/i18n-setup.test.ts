import { describe, expect, it } from 'vitest';
import i18n, { I18N_NAMESPACES } from '../../src/i18n/config.js';

describe('i18n setup', () => {
  it('initializes with en-US fallback', () => {
    expect(i18n.options.fallbackLng).toEqual(['en-US']);
  });

  it('loads all namespaces for en-US', () => {
    for (const namespace of I18N_NAMESPACES) {
      expect(i18n.hasResourceBundle('en-US', namespace)).toBe(true);
    }
  });

  it('falls back to English for missing pt-BR keys', async () => {
    await i18n.changeLanguage('pt-BR');
    expect(i18n.t('actions.save', { ns: 'common' })).toBe('Salvar');
    await i18n.changeLanguage('en-US');
  });
});
