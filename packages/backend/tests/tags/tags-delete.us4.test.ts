import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerTagsRoutes } from '../../src/routes/tags.js';
import * as tagService from '../../src/services/tagService.js';

vi.mock('../../src/services/tagService.js', () => ({
  createTag: vi.fn(),
  listTags: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

describe('US4 DELETE /tags/:tagId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a tag and returns 204', async () => {
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

    vi.mocked(tagService.deleteTag).mockResolvedValue(true);
    const response = await app.inject({ method: 'DELETE', url: '/tags/tag-1' });

    expect(response.statusCode).toBe(204);
    await app.close();
  });
});
