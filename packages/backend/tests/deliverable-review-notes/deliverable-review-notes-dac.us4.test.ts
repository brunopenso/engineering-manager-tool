import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES, USER_ROLE_TYPES } from '../../src/auth/types.js';
import { setOrganizationalHierarchyResolverForTests } from '../../src/services/organizationalHierarchy.js';
import {
  HIERARCHY_USER_IDS,
  sampleOrganizationalHierarchyResolver,
} from '../../src/test/fixtures/organizationalHierarchy.js';
import * as deliverableReviewService from '../../src/services/deliverableReviewService.js';
import * as deliverableService from '../../src/services/deliverableService.js';
import {
  buildDeliverableReviewNotesTestApp,
  registerDeliverableReviewNotesTestRoutes,
} from './deliverable-review-notes-test-app.js';

vi.mock('../../src/services/deliverableService.js', () => ({
  getDeliverableById: vi.fn(),
}));

vi.mock('../../src/services/deliverableReviewService.js', () => ({
  getReviewNotes: vi.fn(),
  saveReviewNotes: vi.fn(),
  setDeliverableReviewed: vi.fn(),
}));

describe('US4 deliverable review notes DAC', () => {
  beforeEach(() => {
    setOrganizationalHierarchyResolverForTests(sampleOrganizationalHierarchyResolver);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setOrganizationalHierarchyResolverForTests(null);
  });

  it('allows authorized superior to save review notes', async () => {
    const app = buildDeliverableReviewNotesTestApp({
      userId: HIERARCHY_USER_IDS.manager,
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerDeliverableReviewNotesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: HIERARCHY_USER_IDS.report,
    } as Awaited<ReturnType<typeof deliverableService.getDeliverableById>>);
    vi.mocked(deliverableReviewService.saveReviewNotes).mockResolvedValue({
      deliverableId: 'del-1',
      notes: 'Coaching notes',
      reviewed: true,
      updatedAt: '2026-05-30T12:00:00.000Z',
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/deliverables/del-1/review-notes',
      payload: { notes: 'Coaching notes' },
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it('denies peer access to review notes', async () => {
    const app = buildDeliverableReviewNotesTestApp({
      userId: HIERARCHY_USER_IDS.report2,
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerDeliverableReviewNotesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: HIERARCHY_USER_IDS.report,
    } as Awaited<ReturnType<typeof deliverableService.getDeliverableById>>);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables/del-1/review-notes',
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('denies subordinate upward access to review notes', async () => {
    const app = buildDeliverableReviewNotesTestApp({
      userId: HIERARCHY_USER_IDS.report,
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerDeliverableReviewNotesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: HIERARCHY_USER_IDS.manager,
    } as Awaited<ReturnType<typeof deliverableService.getDeliverableById>>);

    const response = await app.inject({
      method: 'PUT',
      url: '/deliverables/del-1/review-notes',
      payload: { notes: 'Should fail' },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('denies non-leader access with LEADER_REQUIRED', async () => {
    const app = buildDeliverableReviewNotesTestApp({
      userId: HIERARCHY_USER_IDS.manager,
      roles: [USER_ROLE_TYPES.COLLABORATOR],
    });
    await registerDeliverableReviewNotesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: HIERARCHY_USER_IDS.report,
    } as Awaited<ReturnType<typeof deliverableService.getDeliverableById>>);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables/del-1/review-notes',
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: AUTH_ERROR_CODES.LEADER_REQUIRED });
    await app.close();
  });

  it('denies unauthenticated access', async () => {
    const app = buildDeliverableReviewNotesTestApp({
      userId: HIERARCHY_USER_IDS.manager,
      includeAuth: false,
    });
    await registerDeliverableReviewNotesTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables/del-1/review-notes',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
