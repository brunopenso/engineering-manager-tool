import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProfilePage from '../../src/pages/ProfilePage.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';

describe('US1 profile assigned leader', () => {
  it('shows the signed-in user leader full name as read-only', () => {
    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: {
        ...testUser,
        leader: { id: 'leader-1', fullName: 'Ada Lovelace' },
      },
    });

    expect(screen.getByText('Leader')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /leader/i })).not.toBeInTheDocument();
  });
});
