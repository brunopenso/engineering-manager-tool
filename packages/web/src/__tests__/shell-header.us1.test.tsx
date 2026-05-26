import App from '../App.js';
import { renderWithProviders } from '../test/renderWithProviders.js';
import { getIdentityButton } from '../test/testHelpers.js';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('US1 shell header', () => {
  it('renders fixed system name and authenticated user email', () => {
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    expect(screen.getByText('Engineering Manager Tool')).toBeInTheDocument();
    expect(getIdentityButton()).toBeInTheDocument();
  });
});
