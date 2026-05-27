import App from '../src/App.js';
import { renderWithProviders } from '../src/test/renderWithProviders.js';
import { getIdentityButton } from '../src/test/testHelpers.js';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('US3 logout contract assertions', () => {
  it('requires explicit confirmation before logout redirect', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    await user.click(getIdentityButton());
    expect(
      screen.getByRole('dialog', { name: 'Confirm Logout' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to log out\?/i),
    ).toBeInTheDocument();
  });
});
