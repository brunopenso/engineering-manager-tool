import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoginPage from '../../src/pages/LoginPage.js';
import WelcomePage from '../../src/pages/WelcomePage.js';
import ProfilePage from '../../src/pages/ProfilePage.js';
import DeliverablesPage from '../../src/pages/DeliverablesPage.js';
import { renderWithProviders } from '../../src/test/renderWithProviders.js';
import { stubDeliverablesPageFetch } from '../deliverables/deliverables-page-fetch-mock.js';

describe('US1 English route smoke', () => {
  it('renders login and welcome in English', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/Sign in with Google to access/i)).toBeInTheDocument();

    renderWithProviders(<WelcomePage />, { isAuthenticated: true });
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });

  it('renders profile and deliverables headings in English', async () => {
    stubDeliverablesPageFetch({ list: { deliverables: [] }, tags: [] });

    renderWithProviders(<ProfilePage />, { isAuthenticated: true });
    expect(screen.getByRole('heading', { name: 'Your profile' })).toBeInTheDocument();

    renderWithProviders(<DeliverablesPage />, { isAuthenticated: true });
    expect(await screen.findByRole('heading', { name: 'Deliverables' })).toBeInTheDocument();
  });
});
