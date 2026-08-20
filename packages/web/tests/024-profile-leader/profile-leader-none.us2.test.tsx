import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ProfilePage from '../../src/pages/ProfilePage.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import i18n from '../../src/i18n/index.js';

describe('US2 profile leader empty state', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en-US');
  });

  it('shows empty-state copy when the signed-in user has no leader', () => {
    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: testUser,
    });

    expect(screen.getByText('Leader')).toBeInTheDocument();
    expect(screen.getByText('No leader assigned')).toBeInTheDocument();
  });

  it('shows Portuguese empty-state copy when the profile language is pt-BR', async () => {
    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: { ...testUser, languagePreference: 'pt-BR' },
    });

    await waitFor(() => {
      expect(screen.getByText('Líder')).toBeInTheDocument();
      expect(screen.getByText('Nenhum líder atribuído')).toBeInTheDocument();
    });
  });
});
