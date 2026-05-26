import App from '../App.js';
import { renderWithProviders } from '../test/renderWithProviders.js';
import { getMenuToggleButton } from '../test/testHelpers.js';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('US2 menu toggle', () => {
  it('starts collapsed and expands when toggled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    const menuButton = getMenuToggleButton();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'App navigation' })).not.toBeInTheDocument();

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'App navigation' })).toBeInTheDocument();
  });
});
