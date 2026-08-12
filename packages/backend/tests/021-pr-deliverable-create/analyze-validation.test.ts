import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../../src/auth/types.js';
import { registerDeliverablesRoutes } from '../../src/routes/deliverables.js';
import {
  analyzeDeliverableFromPullRequests,
  validateAnalyzeFromPullRequestsInput,
} from '../../src/services/deliverableFromPrsService.js';
import { SELF_AUTH } from '../018-github-pr-import/github-pr-import.setup.js';

vi.mock('../../src/services/deliverableFromPrsService.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/services/deliverableFromPrsService.js')
  >('../../src/services/deliverableFromPrsService.js');
  return {
    ...actual,
    analyzeDeliverableFromPullRequests: vi.fn(),
  };
});

const analyzeMock = vi.mocked(analyzeDeliverableFromPullRequests);

async function buildApp(auth: typeof SELF_AUTH | null) {
  const app = Fastify();
  if (auth) {
    app.addHook('onRequest', (request, _reply, done) => {
      request.auth = { ...auth };
      done();
    });
  }
  await registerDeliverablesRoutes(app);
  return app;
}

describe('021 analyze validation', () => {
  const validId = '11111111-1111-4111-8111-111111111111';

  it('accepts valid ids and dedupes', () => {
    expect(
      validateAnalyzeFromPullRequestsInput({
        pullRequestIds: [validId, validId],
      }),
    ).toEqual({ pullRequestIds: [validId] });
  });

  it('rejects empty pullRequestIds', () => {
    expect(() => validateAnalyzeFromPullRequestsInput({ pullRequestIds: [] })).toThrow(
      /non-empty array/,
    );
  });

  it('rejects more than 50 ids', () => {
    const ids = Array.from(
      { length: 51 },
      (_, index) => `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`,
    );
    expect(() => validateAnalyzeFromPullRequestsInput({ pullRequestIds: ids })).toThrow(
      /at most 50/,
    );
  });

  it('rejects invalid uuid', () => {
    expect(() => validateAnalyzeFromPullRequestsInput({ pullRequestIds: ['not-a-uuid'] })).toThrow(
      /valid UUID/,
    );
  });
});

describe('POST /deliverables/from-pull-requests/analyze', () => {
  beforeEach(() => {
    analyzeMock.mockReset();
  });

  it('returns 401 when unauthenticated', async () => {
    const app = await buildApp(null);
    const response = await app.inject({
      method: 'POST',
      url: '/deliverables/from-pull-requests/analyze',
      payload: { pullRequestIds: ['11111111-1111-4111-8111-111111111111'] },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.MISSING_APP_TOKEN);
    await app.close();
  });

  it('returns 400 for empty pullRequestIds', async () => {
    const app = await buildApp(SELF_AUTH);
    const response = await app.inject({
      method: 'POST',
      url: '/deliverables/from-pull-requests/analyze',
      payload: { pullRequestIds: [] },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);
    expect(analyzeMock).not.toHaveBeenCalled();
    await app.close();
  });

  it('returns proposal on success', async () => {
    analyzeMock.mockResolvedValue({
      sourcePullRequestIds: ['11111111-1111-4111-8111-111111111111'],
      proposal: {
        title: 'Fix widgets',
        description: 'Proposed…',
        roleInDeliverable: 'Author',
        businessImpact: 'MEDIUM',
        improvementPoints: 'Review…',
        systemTagIds: [],
        technicalDescription: null,
        userTags: ['widgets'],
        links: [],
      },
    });

    const app = await buildApp(SELF_AUTH);
    const response = await app.inject({
      method: 'POST',
      url: '/deliverables/from-pull-requests/analyze',
      payload: { pullRequestIds: ['11111111-1111-4111-8111-111111111111'] },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().proposal.title).toBe('Fix widgets');
    expect(analyzeMock).toHaveBeenCalledWith(SELF_AUTH.userId, {
      pullRequestIds: ['11111111-1111-4111-8111-111111111111'],
    });
    await app.close();
  });
});
