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

describe('GET /tags/catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns tag catalog for authenticated collaborators', async () => {
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

    vi.mocked(tagService.listTags).mockResolvedValue([
      {
        id: 'tag-1',
        name: 'Platform',
        color: '#1976D2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const response = await app.inject({ method: 'GET', url: '/tags/catalog' });

    expect(response.statusCode).toBe(200);
    expect(response.json().tags).toHaveLength(1);
    await app.close();
  });
});
