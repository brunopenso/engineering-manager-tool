import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import App from '../../src/App.js';
import { renderWithProviders, testLeaderUser } from '../../src/test/renderWithProviders.js';

describe('US3 assignment context in create form', () => {
  it('shows automatic assignment copy and no leader selector', () => {
    renderWithProviders(<App />, {
      initialPath: '/app/leader/hierarchy',
      isAuthenticated: true,
      user: testLeaderUser,
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Create User' }));

    expect(screen.getByText(/Leader assigned automatically to you/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Leader')).not.toBeInTheDocument();
  });
});
