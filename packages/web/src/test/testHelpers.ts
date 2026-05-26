import { screen } from '@testing-library/react';
import { testUser } from './renderWithProviders.js';

export const LOGIN_HEADING = 'Engineering Manager Tool';

export function getIdentityButton(email: string = testUser.email) {
  return screen.getByRole('button', { name: new RegExp(email) });
}

export function getMenuToggleButton() {
  return screen.getByRole('button', { name: /open drawer/i });
}
