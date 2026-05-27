import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import App from '../../src/App.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';

describe('US2 non-leader route deny', () => {
  it('redirects non-leader away from leader create page', () => {
    renderWithProviders(<App />, {
      initialPath: '/app/leader/users/new',
      isAuthenticated: true,
      user: testUser,
    });

    expect(screen.queryByText('Create new user')).not.toBeInTheDocument();
  });
});
