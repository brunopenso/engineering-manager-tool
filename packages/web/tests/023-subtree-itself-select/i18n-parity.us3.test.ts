import { describe, expect, it } from 'vitest';
import enLeader from '../../src/locales/en-US/leader.json';
import ptLeader from '../../src/locales/pt-BR/leader.json';

describe('US3 i18n scope feedback keys', () => {
  it('keeps owner column and scope labels in both locales', () => {
    expect(enLeader.picker.ownerColumn).toBeTruthy();
    expect(ptLeader.picker.ownerColumn).toBeTruthy();
    expect(enLeader.picker.scopeSubtree).toBeTruthy();
    expect(ptLeader.picker.scopeSubtree).toBeTruthy();
  });
});
