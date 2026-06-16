import { describe, expect, it, beforeEach } from 'vitest';
import i18n from '../../src/i18n/config.js';

describe('US3 login language detector', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en-US');
  });

  it('maps pt browser language to pt-BR', () => {
    const detected = i18n.options.detection?.convertDetectedLanguage?.('pt-BR', undefined);
    expect(detected).toBe('pt-BR');
  });

  it('falls back unsupported languages to en-US', () => {
    const detected = i18n.options.detection?.convertDetectedLanguage?.('fr', undefined);
    expect(detected).toBe('en-US');
  });
});
