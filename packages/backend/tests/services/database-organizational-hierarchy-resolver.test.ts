import { beforeEach, describe, expect, it, vi } from 'vitest';
import { databaseOrganizationalHierarchyResolver } from '../../src/services/databaseOrganizationalHierarchyResolver.js';
import * as userService from '../../src/services/userService.js';

vi.mock('../../src/services/userService.js', () => ({
  isUserInLeaderSubtree: vi.fn(),
}));

describe('databaseOrganizationalHierarchyResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to isUserInLeaderSubtree with ancestor as actor and descendant as target', async () => {
    vi.mocked(userService.isUserInLeaderSubtree).mockResolvedValue(true);

    const result = await databaseOrganizationalHierarchyResolver.isDescendantOf(
      'report-user',
      'leader-user',
    );

    expect(result).toBe(true);
    expect(userService.isUserInLeaderSubtree).toHaveBeenCalledWith('leader-user', 'report-user');
  });

  it('returns false when target is not in leader subtree', async () => {
    vi.mocked(userService.isUserInLeaderSubtree).mockResolvedValue(false);

    const result = await databaseOrganizationalHierarchyResolver.isDescendantOf(
      'peer-user',
      'leader-user',
    );

    expect(result).toBe(false);
    expect(userService.isUserInLeaderSubtree).toHaveBeenCalledWith('leader-user', 'peer-user');
  });
});
