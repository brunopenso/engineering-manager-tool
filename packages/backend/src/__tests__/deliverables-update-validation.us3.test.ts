import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidSystemTagError } from '../services/deliverableValidation.js';
import * as deliverableService from '../services/deliverableService.js';
import {
  buildDeliverablesTestApp,
  registerDeliverablesTestRoutes,
} from './deliverables-test-app.js';

vi.mock('../services/deliverableService.js', () => ({
  createDeliverable: vi.fn(),
  listDeliverablesForOwner: vi.fn(),
  getDeliverableById: vi.fn(),
  updateDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  mapDeliverableDetail: vi.fn(),
}));

describe('US3 PATCH validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when system tags are invalid on update', async () => {
    const app = buildDeliverablesTestApp({ userId: 'owner-1' });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: 'owner-1',
    } as never);

    vi.mocked(deliverableService.updateDeliverable).mockRejectedValue(
      new InvalidSystemTagError('One or more system tags are invalid or no longer available.'),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/deliverables/del-1',
      payload: {
        title: 'Updated',
        description: 'Desc',
        roleInDeliverable: 'Lead',
        systemTagIds: ['missing'],
        businessImpact: 'MEDIUM',
        improvementPoints: 'Docs',
        userTags: [],
        links: [],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'INVALID_SYSTEM_TAG' });
    await app.close();
  });
});
