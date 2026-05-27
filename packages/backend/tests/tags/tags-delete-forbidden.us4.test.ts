import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerTagsRoutes } from '../../src/routes/tags.js';

vi.mock('../../src/services/tagService.js', () => ({
  createTag: vi.fn(),
  listTags: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

describe('US4 delete forbidden', () => {
  it('blocks non-admin users from deleting tags', async () => {
    const app = Fastify();
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = {
        userId: 'user-1',
        email: 'user@example.com',
        fullName: 'User',
        roles: ['COLLABORATOR'],
      };
      done();
    });
    await registerTagsRoutes(app);

    const response = await app.inject({ method: 'DELETE', url: '/tags/tag-1' });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.FORBIDDEN);
    await app.close();
  });
});
