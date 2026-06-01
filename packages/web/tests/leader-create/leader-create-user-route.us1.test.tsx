import { describe, expect, it } from 'vitest';
import { getVisibleShellMenuOptions } from '../../src/routes/shellOptions.js';
import { testLeaderUser, testUser } from '../../src/test/renderWithProviders.js';

describe('US1 leader hierarchy route visibility', () => {
  it('shows hierarchy management route for leaders', () => {
    const options = getVisibleShellMenuOptions(testLeaderUser);
    const routes = options.map((option) => option.route);
    expect(routes).toContain('/app/leader/hierarchy');
    expect(routes).not.toContain('/app/leader/users/new');
  });

  it('hides hierarchy management route for non-leaders', () => {
    const routes = getVisibleShellMenuOptions(testUser).map((option) => option.route);
    expect(routes).not.toContain('/app/leader/hierarchy');
    expect(routes).not.toContain('/app/leader/users/new');
  });
});
