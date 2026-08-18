import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataSource } from '../../src/database/connection.js';
import { User } from '../../src/database/entities/User.js';
import { resolveScopedOwnerUserIds } from '../../src/services/userService.js';

describe('resolveScopedOwnerUserIds', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns all actor descendants when userId is omitted', async () => {
    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      query: vi.fn().mockResolvedValue([
        { id: 'alice', full_name: 'Alice', email: 'a@x.com', leader_id: 'leader' },
        { id: 'bob', full_name: 'Bob', email: 'b@x.com', leader_id: 'alice' },
      ]),
    } as never);

    const result = await resolveScopedOwnerUserIds('leader');

    expect(result).toEqual({
      ownerUserIds: ['alice', 'bob'],
    });
  });

  it('returns singleton for itself scope', async () => {
    const query = vi.fn();
    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({ query } as never);

    const result = await resolveScopedOwnerUserIds('leader', 'alice', 'itself');

    expect(result).toEqual({
      ownerUserIds: ['alice'],
      filteredUserId: 'alice',
      scope: 'itself',
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('includes selected user and all descendants for subtree (default)', async () => {
    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      query: vi.fn().mockResolvedValue([
        { id: 'bob', full_name: 'Bob', email: 'b@x.com', leader_id: 'alice' },
        { id: 'carol', full_name: 'Carol', email: 'c@x.com', leader_id: 'alice' },
        { id: 'dave', full_name: 'Dave', email: 'd@x.com', leader_id: 'carol' },
      ]),
    } as never);

    const result = await resolveScopedOwnerUserIds('leader', 'alice');

    expect(result.scope).toBe('subtree');
    expect(result.filteredUserId).toBe('alice');
    expect(result.ownerUserIds).toEqual(['alice', 'bob', 'carol', 'dave']);
  });

  it('treats leaf subtree as singleton person', async () => {
    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      query: vi.fn().mockResolvedValue([]),
    } as never);

    const result = await resolveScopedOwnerUserIds('leader', 'eve', 'subtree');

    expect(result).toEqual({
      ownerUserIds: ['eve'],
      filteredUserId: 'eve',
      scope: 'subtree',
    });
  });

  it('uses User repository when querying descendants', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const getRepository = vi.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      query,
    } as never);

    await resolveScopedOwnerUserIds('leader', 'alice', 'subtree');

    expect(getRepository).toHaveBeenCalledWith(User);
    expect(query).toHaveBeenCalled();
  });
});
