import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProfilePage from '../pages/ProfilePage.js';
import { renderWithProviders, testUser } from '../test/renderWithProviders.js';

describe('US2 profile roles', () => {
  it('renders active role badges for the signed-in user', () => {
    renderWithProviders(<ProfilePage />, {
      isAuthenticated: true,
      user: {
        ...testUser,
        roles: ['COLLABORATOR', 'LEADER'],
      },
    });

    expect(screen.getByText('Your profile')).toBeInTheDocument();
    expect(screen.getByText('Collaborator')).toBeInTheDocument();
    expect(screen.getByText('Leader')).toBeInTheDocument();
  });
});
