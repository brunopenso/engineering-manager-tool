import App from '../App.js';
import { renderWithProviders, testUser } from '../test/renderWithProviders.js';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('US3 logout contract assertions', () => {
  it('requires explicit confirmation before logout redirect', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    await user.click(screen.getByRole('button', { name: testUser.email }));
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    expect(screen.getByText('Do you want to log out?')).toBeInTheDocument();
  });
});
