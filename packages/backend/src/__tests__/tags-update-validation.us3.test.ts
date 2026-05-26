import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { registerTagsRoutes } from '../routes/tags.js';
import * as tagService from '../services/tagService.js';
import { TagDuplicateNameError, TagValidationError } from '../services/tagValidation.js';

vi.mock('../services/tagService.js', () => ({
  createTag: vi.fn(),
  listTags: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

describe('US3 update validations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns duplicate code when name already exists', async () => {
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

    vi.mocked(tagService.updateTag).mockRejectedValue(new TagDuplicateNameError('Duplicate'));
    const response = await app.inject({
      method: 'PATCH',
      url: '/tags/tag-1',
      payload: { name: 'Platform' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.DUPLICATE_TAG_NAME);
    await app.close();
  });

  it('returns validation code for invalid payload', async () => {
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

    vi.mocked(tagService.updateTag).mockRejectedValue(new TagValidationError('Invalid'));
    const response = await app.inject({
      method: 'PATCH',
      url: '/tags/tag-1',
      payload: { color: 'blue' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);
    await app.close();
  });
});
