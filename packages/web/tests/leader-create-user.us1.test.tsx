import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';
import { renderWithProviders, testLeaderUser } from '../src/test/renderWithProviders.js';

describe('US1 leader create user form', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits form and shows success message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'new-user-1',
            fullName: 'New Person',
            email: 'new.person@example.com',
            role: 'COLLABORATOR',
            leaderId: testLeaderUser.id,
            createdByUserId: testLeaderUser.id,
            createdAt: '2026-05-26T00:00:00.000Z',
          },
        }),
      }),
    );

    renderWithProviders(<App />, {
      initialPath: '/app/leader/users/new',
      isAuthenticated: true,
      user: testLeaderUser,
    });

    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), {
      target: { value: 'New Person' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'new.person@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Leader assigned automatically to you/i),
      ).toBeInTheDocument();
    });
  });
});
