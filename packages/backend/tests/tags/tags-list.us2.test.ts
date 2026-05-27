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

describe('US2 GET /tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists tags for administrators', async () => {
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

    vi.mocked(tagService.listTags).mockResolvedValue([
      { id: 'tag-1', name: 'Platform', color: '#1976D2' } as never,
    ]);

    const response = await app.inject({ method: 'GET', url: '/tags' });
    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload.tags).toHaveLength(1);
    expect(payload.tags[0].name).toBe('Platform');
    await app.close();
  });
});
