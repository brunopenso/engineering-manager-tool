import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerTagsRoutes } from '../routes/tags.js';
import * as tagService from '../services/tagService.js';

vi.mock('../services/tagService.js', () => ({
  createTag: vi.fn(),
  listTags: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

describe('US1 POST /tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a tag for administrators', async () => {
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

    vi.mocked(tagService.createTag).mockResolvedValue({
      id: 'tag-1',
      name: 'Platform',
      color: '#1976D2',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/tags',
      payload: { name: 'Platform', color: '#1976D2' },
    });

    expect(response.statusCode).toBe(201);
    expect(tagService.createTag).toHaveBeenCalledWith({ name: 'Platform', color: '#1976D2' });
    await app.close();
  });
});
