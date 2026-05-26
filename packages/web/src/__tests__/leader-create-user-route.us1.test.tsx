import { describe, expect, it } from 'vitest';
import { getVisibleShellMenuOptions } from '../routes/shellOptions.js';
import { testLeaderUser, testUser } from '../test/renderWithProviders.js';

describe('US1 leader create route visibility', () => {
  it('shows create user route for leaders near profile', () => {
    const options = getVisibleShellMenuOptions(testLeaderUser);
    const routes = options.map((option) => option.route);
    expect(routes).toContain('/app/leader/users/new');

    const createIndex = routes.indexOf('/app/leader/users/new');
    const deliverablesIndex = routes.indexOf('/app/deliverables');
    expect(createIndex).toBeGreaterThan(-1);
    expect(createIndex).toBeLessThan(deliverablesIndex);
  });

  it('hides create user route for non-leaders', () => {
    const routes = getVisibleShellMenuOptions(testUser).map((option) => option.route);
    expect(routes).not.toContain('/app/leader/users/new');
  });
});
