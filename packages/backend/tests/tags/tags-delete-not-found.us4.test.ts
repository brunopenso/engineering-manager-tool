import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerTagsRoutes } from '../../src/routes/tags.js';
import * as tagService from '../../src/services/tagService.js';

vi.mock('../../src/services/tagService.js', () => ({
  createTag: vi.fn(),
  listTags: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

describe('US4 delete not found', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when tag does not exist', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = {
        userId: 'admin-1',
        email: 'admin@example.com',
        fullName: 'Admin',
        roles: ['COLLABORATOR', 'ADMINISTRATOR'],
      };
      done();
    });
    await registerTagsRoutes(app);

    vi.mocked(tagService.deleteTag).mockResolvedValue(false);
    const response = await app.inject({ method: 'DELETE', url: '/tags/missing' });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.NOT_FOUND);
    await app.close();
  });
});
