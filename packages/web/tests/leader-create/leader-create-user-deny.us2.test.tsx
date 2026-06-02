import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import App from '../../src/App.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';

describe('US2 non-leader route deny', () => {
  it('redirects non-leader away from leader hierarchy page', () => {
    renderWithProviders(<App />, {
      initialPath: '/app/leader/hierarchy',
      isAuthenticated: true,
      user: testUser,
    });

    expect(screen.queryByRole('tab', { name: 'Create User' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /full name/i })).not.toBeInTheDocument();
  });
});
