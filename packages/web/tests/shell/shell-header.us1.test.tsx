import App from '../../src/App.js';
import { renderWithProviders, testUser } from '../../src/test/renderWithProviders.js';
import { getIdentityButton } from '../../src/test/testHelpers.js';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('US1 shell header', () => {
  it('renders fixed system name and authenticated user name and email', () => {
    renderWithProviders(<App />, { initialPath: '/app', isAuthenticated: true });

    expect(screen.getByText('Engineering Manager Tool')).toBeInTheDocument();
    expect(screen.getByText(testUser.fullName)).toBeInTheDocument();
    expect(screen.getByText(testUser.email)).toBeInTheDocument();
    expect(getIdentityButton()).toBeInTheDocument();
  });
});
