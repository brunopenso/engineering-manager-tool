import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';

describe('US1 admin GitHub route guard', () => {
  it('redirects non-admin users away from /app/admin/github', async () => {
    renderWithProviders(<App />, {
      initialPath: '/app/admin/github',
      isAuthenticated: true,
      user: testUser,
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
  });
});
