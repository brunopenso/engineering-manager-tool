import { describe, expect, it, vi } from 'vitest';
import { createUserByLeader } from '../src/services/userService.js';
import { AppDataSource } from '../src/database/connection.js';
import { User } from '../src/database/entities/User.js';
import { UserCreationAudit } from '../src/database/entities/UserCreationAudit.js';
import { UserRole } from '../src/database/entities/UserRole.js';

describe('user create audit persistence', () => {
  it('writes audit row for successful leader-created user', async () => {
    const savedUser = {
      id: 'created-1',
      email: 'created@example.com',
      fullName: 'Created User',
      createdAt: new Date('2026-05-26T00:00:00.000Z'),
    };
    const userRepo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((value) => value),
      save: vi.fn().mockResolvedValue(savedUser),
    };
    const auditRepo = {
      create: vi.fn().mockImplementation((value) => value),
      save: vi.fn().mockResolvedValue({}),
    };
    const roleRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 'existing-collab-role' }),
    };
    const getRepositorySpy = vi
      .spyOn(AppDataSource, 'getRepository')
      .mockImplementation((entity) => {
        if (entity === User) {
          return userRepo as never;
        }
        if (entity === UserCreationAudit) {
          return auditRepo as never;
        }
        if (entity === UserRole) {
          return roleRepo as never;
        }
        return {} as never;
      });

    await createUserByLeader('leader-1', {
      fullName: 'Created User',
      email: 'created@example.com',
      role: 'COLLABORATOR',
    });

    expect(auditRepo.save).toHaveBeenCalled();
    expect(auditRepo.create).toHaveBeenCalledWith({
      createdUserId: 'created-1',
      creatorLeaderUserId: 'leader-1',
    });

    getRepositorySpy.mockRestore();
  });
});
