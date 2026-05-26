import App from '../App.js';
import { renderWithProviders } from '../test/renderWithProviders.js';
import { getIdentityButton, LOGIN_HEADING } from '../test/testHelpers.js';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('US3 logout confirmation', () => {
  it('shows inline confirmation on first identity click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    await user.click(getIdentityButton());

    expect(
      screen.getByText(/Are you sure you want to log out\?/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('clears session and redirects to login on confirm', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    await user.click(getIdentityButton());
    await user.click(screen.getByRole('button', { name: 'Log Out' }));

    expect(screen.getByRole('heading', { name: LOGIN_HEADING })).toBeInTheDocument();
  });

  it('keeps session active when logout is canceled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    await user.click(getIdentityButton());
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Confirm Logout' }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });
});
