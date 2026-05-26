import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { registerTagsRoutes } from '../routes/tags.js';
import * as tagService from '../services/tagService.js';
import { TagDuplicateNameError } from '../services/tagValidation.js';

vi.mock('../services/tagService.js', () => ({
  createTag: vi.fn(),
  listTags: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

describe('US1 create duplicate names', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns duplicate name error when same name exists', async () => {
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

    vi.mocked(tagService.createTag).mockRejectedValue(
      new TagDuplicateNameError('A tag with this name already exists.'),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/tags',
      payload: { name: 'Platform', color: '#1976D2' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.DUPLICATE_TAG_NAME);
    await app.close();
  });
});
