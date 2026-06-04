import { describe, expect, it } from 'vitest';
import { ADMIN_GITHUB_ROUTE, getVisibleShellMenuOptions } from '../../src/routes/shellOptions.js';
import { testAdminUser, testUser } from '../../src/test/renderWithProviders.js';

describe('US1 admin GitHub menu', () => {
  it('hides GitHub integration for non-administrators', () => {
    const routes = getVisibleShellMenuOptions(testUser).map((option) => option.route);
    expect(routes).not.toContain(ADMIN_GITHUB_ROUTE);
  });

  it('shows GitHub integration for administrators', () => {
    const routes = getVisibleShellMenuOptions(testAdminUser).map((option) => option.route);
    expect(routes).toContain(ADMIN_GITHUB_ROUTE);
  });
});
