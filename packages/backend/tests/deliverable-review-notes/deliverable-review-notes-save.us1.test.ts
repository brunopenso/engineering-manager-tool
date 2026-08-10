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
  ReviewNotesValidationError: class ReviewNotesValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'VALIDATION_ERROR';
    }
  },
}));

vi.mock('../../src/services/authorizationService.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/authorizationService.js')>();
  return {
    ...actual,
    assertCanReadDeliverables: vi.fn(),
  };
});

describe('US1 deliverable review notes save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists notes and auto-marks reviewed for authorized leader', async () => {
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
    vi.mocked(deliverableReviewService.saveReviewNotes).mockResolvedValue({
      deliverableId: 'del-1',
      notes: 'Great coaching point',
      reviewed: true,
      updatedAt: '2026-05-30T12:00:00.000Z',
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/deliverables/del-1/review-notes',
      payload: { notes: 'Great coaching point' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      deliverableId: 'del-1',
      notes: 'Great coaching point',
      reviewed: true,
    });
    expect(deliverableReviewService.saveReviewNotes).toHaveBeenCalledWith(
      'del-1',
      'leader-1',
      'Great coaching point',
    );

    await app.close();
  });

  it('rejects notes longer than 8000 characters', async () => {
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
    vi.mocked(deliverableReviewService.saveReviewNotes).mockRejectedValue(
      new deliverableReviewService.ReviewNotesValidationError(
        'Review notes must be at most 8000 characters.',
      ),
    );

    const response = await app.inject({
      method: 'PUT',
      url: '/deliverables/del-1/review-notes',
      payload: { notes: 'x'.repeat(8001) },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });

    await app.close();
  });

  it('allows empty save to clear notes without forcing reviewed change in service response', async () => {
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
    vi.mocked(deliverableReviewService.saveReviewNotes).mockResolvedValue({
      deliverableId: 'del-1',
      notes: null,
      reviewed: true,
      updatedAt: '2026-05-30T12:00:00.000Z',
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/deliverables/del-1/review-notes',
      payload: { notes: '   ' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ notes: null, reviewed: true });

    await app.close();
  });
});
