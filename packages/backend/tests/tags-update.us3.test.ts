import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerTagsRoutes } from '../src/routes/tags.js';
import * as tagService from '../src/services/tagService.js';

vi.mock('../src/services/tagService.js', () => ({
  createTag: vi.fn(),
  listTags: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

describe('US3 PATCH /tags/:tagId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates tags while preserving id', async () => {
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

    vi.mocked(tagService.updateTag).mockResolvedValue({
      id: 'tag-1',
      name: 'Platform',
      color: '#E91E63',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/tags/tag-1',
      payload: { color: '#E91E63' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().tag.id).toBe('tag-1');
    await app.close();
  });
});
