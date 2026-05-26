import App from '../App.js';
import { renderWithProviders } from '../test/renderWithProviders.js';
import { getMenuToggleButton } from '../test/testHelpers.js';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('US2 menu selection', () => {
  it('updates content route and auto-collapses after option selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    const menuButton = getMenuToggleButton();
    await user.click(menuButton);
    await user.click(screen.getByRole('link', { name: 'Team Updates' }));

    expect(screen.getByRole('heading', { name: 'Team Updates' })).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });
});
