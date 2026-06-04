import { describe, expect, it } from 'vitest';
import {
  ADMIN_GITHUB_ROUTE,
  getVisibleShellMenuOptions,
  getVisibleShellMenuSections,
  SHELL_MENU_OPTIONS,
} from '../../src/routes/shellOptions.js';
import { testAdminUser, testLeaderUser, testUser } from '../../src/test/renderWithProviders.js';

describe('US4 role-aware shell menu', () => {
  it('hides admin menu entry for non-administrators', () => {
    const options = getVisibleShellMenuOptions(testUser);
    const routes = options.map((option) => option.route);

    expect(routes).not.toContain('/app/admin/users');
    expect(routes).not.toContain(ADMIN_GITHUB_ROUTE);
    expect(options.length).toBe(SHELL_MENU_OPTIONS.length);
  });

  it('shows admin menu entry for administrators', () => {
    const options = getVisibleShellMenuOptions(testAdminUser);
    const routes = options.map((option) => option.route);

    expect(routes).toContain('/app/admin/users');
    expect(routes).toContain(ADMIN_GITHUB_ROUTE);
  });

  it('returns collaborator-only sections for collaborators', () => {
    const sections = getVisibleShellMenuSections(testUser);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.id).toBe('collaborator');
    expect(sections[0]?.title).toBeUndefined();
  });

  it('returns leader section for leaders', () => {
    const sections = getVisibleShellMenuSections(testLeaderUser);

    expect(sections.map((section) => section.id)).toEqual(['collaborator', 'leader']);
    expect(sections[1]?.title).toBe('Leader');
  });

  it('returns administration section for administrators', () => {
    const sections = getVisibleShellMenuSections(testAdminUser);

    expect(sections.map((section) => section.id)).toEqual(['collaborator', 'administration']);
    expect(sections[1]?.title).toBe('Administration');
  });
});
