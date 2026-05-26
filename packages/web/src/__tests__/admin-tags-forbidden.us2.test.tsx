import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App.js';
import { renderWithProviders, testUser } from '../test/renderWithProviders.js';

describe('US2 admin tags guard', () => {
  it('redirects non-admin users away from /app/admin/tags', async () => {
    renderWithProviders(<App />, {
      initialPath: '/app/admin/tags',
      isAuthenticated: true,
      user: testUser,
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
  });
});
