import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLE_TYPES } from '../../src/auth/types.js';
import * as authorizationService from '../../src/services/authorizationService.js';
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

vi.mock('../../src/services/authorizationService.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/authorizationService.js')>();
  return {
    ...actual,
    assertCanReadDeliverables: vi.fn(),
  };
});

describe('US2 deliverable review notes load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns saved notes for the logged-in reviewer', async () => {
    const app = buildDeliverableReviewNotesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerDeliverableReviewNotesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'report-1',
    } as Awaited<ReturnType<typeof deliverableService.getDeliverableById>>);
    vi.mocked(authorizationService.assertCanReadDeliverables).mockResolvedValue(undefined);
    vi.mocked(deliverableReviewService.getReviewNotes).mockResolvedValue({
      deliverableId: 'del-1',
      notes: 'Prior feedback',
      reviewed: true,
      updatedAt: '2026-05-29T10:00:00.000Z',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables/del-1/review-notes',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      notes: 'Prior feedback',
      reviewed: true,
    });
    expect(deliverableReviewService.getReviewNotes).toHaveBeenCalledWith('del-1', 'leader-1');

    await app.close();
  });

  it('returns defaults when reviewer has no notes row', async () => {
    const app = buildDeliverableReviewNotesTestApp({
      userId: 'leader-1',
      roles: [USER_ROLE_TYPES.COLLABORATOR, USER_ROLE_TYPES.LEADER],
    });
    await registerDeliverableReviewNotesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'report-1',
    } as Awaited<ReturnType<typeof deliverableService.getDeliverableById>>);
    vi.mocked(authorizationService.assertCanReadDeliverables).mockResolvedValue(undefined);
    vi.mocked(deliverableReviewService.getReviewNotes).mockResolvedValue({
      deliverableId: 'del-1',
      notes: null,
      reviewed: false,
      updatedAt: null,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables/del-1/review-notes',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      notes: null,
      reviewed: false,
      updatedAt: null,
    });

    await app.close();
  });
});
