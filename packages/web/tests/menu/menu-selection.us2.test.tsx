import App from '../../src/App.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';
import { getMenuToggleButton } from '../../src/test/testHelpers.js';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('US2 menu selection', () => {
  it('updates content route and auto-collapses after option selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    const menuButton = getMenuToggleButton();
    await user.click(menuButton);
    await user.click(screen.getByRole('link', { name: 'Profile' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Your profile' })).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
