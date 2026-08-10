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

describe('US3 deliverable review notes isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns leader-specific notes scoped to reviewer user id', async () => {
    const app = buildDeliverableReviewNotesTestApp({
      userId: 'leader-a',
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
      notes: 'Focus on testing',
      reviewed: true,
      updatedAt: '2026-05-30T12:00:00.000Z',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables/del-1/review-notes',
    });

    expect(response.statusCode).toBe(200);
    expect(deliverableReviewService.getReviewNotes).toHaveBeenCalledWith('del-1', 'leader-a');

    await app.close();
  });

  it('saves notes under the authenticated reviewer without cross-leader mutation', async () => {
    const app = buildDeliverableReviewNotesTestApp({
      userId: 'leader-b',
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
      notes: 'Great stakeholder comms',
      reviewed: true,
      updatedAt: '2026-05-30T12:00:00.000Z',
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/deliverables/del-1/review-notes',
      payload: { notes: 'Great stakeholder comms' },
    });

    expect(response.statusCode).toBe(200);
    expect(deliverableReviewService.saveReviewNotes).toHaveBeenCalledWith(
      'del-1',
      'leader-b',
      'Great stakeholder comms',
    );

    await app.close();
  });
});
