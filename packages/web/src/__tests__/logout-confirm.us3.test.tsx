import App from '../App.js';
import { renderWithProviders, testUser } from '../test/renderWithProviders.js';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('US3 logout confirmation', () => {
  it('shows inline confirmation on first identity click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    await user.click(screen.getByRole('button', { name: testUser.email }));

    expect(screen.getByText('Do you want to log out?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm logout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('clears session and redirects to login on confirm', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    await user.click(screen.getByRole('button', { name: testUser.email }));
    await user.click(screen.getByRole('button', { name: 'Confirm logout' }));

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('keeps session active when logout is canceled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    await user.click(screen.getByRole('button', { name: testUser.email }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Do you want to log out?')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });
});
