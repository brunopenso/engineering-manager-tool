import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../auth/types.js';
import { registerTagsRoutes } from '../routes/tags.js';
import * as tagService from '../services/tagService.js';
import { TagValidationError } from '../services/tagValidation.js';

vi.mock('../services/tagService.js', () => ({
  createTag: vi.fn(),
  listTags: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

describe('US1 create tag validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when name or color is missing', async () => {
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

    const response = await app.inject({
      method: 'POST',
      url: '/tags',
      payload: { name: '' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);
    await app.close();
  });

  it('maps validation errors from service to 400', async () => {
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

    vi.mocked(tagService.createTag).mockRejectedValue(new TagValidationError('Tag color must be valid.'));

    const response = await app.inject({
      method: 'POST',
      url: '/tags',
      payload: { name: 'Platform', color: 'red' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);
    await app.close();
  });
});
