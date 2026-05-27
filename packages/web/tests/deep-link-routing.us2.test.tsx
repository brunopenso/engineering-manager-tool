import App from '../src/App.js';
import { renderWithProviders } from '../src/test/renderWithProviders.js';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('US2 deep-link routing', () => {
  it('renders selected menu content from deep-link route', () => {
    renderWithProviders(<App />, { initialPath: '/app/updates', isAuthenticated: true });

    expect(screen.getByRole('heading', { name: 'Team Updates' })).toBeInTheDocument();
  });
});
