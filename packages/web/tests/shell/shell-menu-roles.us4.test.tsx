import { describe, expect, it } from 'vitest';
import {
  getVisibleShellMenuOptions,
  SHELL_MENU_OPTIONS,
} from '../../src/routes/shellOptions.js';
import { testAdminUser, testUser } from '../../src/test/renderWithProviders.js';

describe('US4 role-aware shell menu', () => {
  it('hides admin menu entry for non-administrators', () => {
    const options = getVisibleShellMenuOptions(testUser);
    const routes = options.map((option) => option.route);

    expect(routes).not.toContain('/app/admin/users');
    expect(options.length).toBe(SHELL_MENU_OPTIONS.length);
  });

  it('shows admin menu entry for administrators', () => {
    const options = getVisibleShellMenuOptions(testAdminUser);
    const routes = options.map((option) => option.route);

    expect(routes).toContain('/app/admin/users');
  });
});
