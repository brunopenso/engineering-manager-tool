import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders, testAdminUser } from '../src/test/renderWithProviders.js';

describe('US1 create form validation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps create action disabled when name is blank', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tags: [] }),
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/admin/tags',
      isAuthenticated: true,
      user: testAdminUser,
    });

    expect(screen.getByRole('button', { name: 'Create tag' })).toBeDisabled();
  });
});
