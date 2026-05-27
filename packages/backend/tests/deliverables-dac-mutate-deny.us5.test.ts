import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setOrganizationalHierarchyResolverForTests } from '../src/services/organizationalHierarchy.js';
import {
  HIERARCHY_USER_IDS,
  sampleOrganizationalHierarchyResolver,
} from '../src/test/fixtures/organizationalHierarchy.js';
import * as deliverableService from '../src/services/deliverableService.js';
import {
  buildDeliverablesTestApp,
  registerDeliverablesTestRoutes,
} from './deliverables-test-app.js';

vi.mock('../src/services/deliverableService.js', () => ({
  createDeliverable: vi.fn(),
  listDeliverablesForOwner: vi.fn(),
  getDeliverableById: vi.fn(),
  updateDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  mapDeliverableDetail: vi.fn(),
}));

describe('US5 superior mutate deny', () => {
  beforeEach(() => {
    setOrganizationalHierarchyResolverForTests(sampleOrganizationalHierarchyResolver);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setOrganizationalHierarchyResolverForTests(null);
  });

  it('denies superior PATCH on subordinate deliverable', async () => {
    const app = buildDeliverablesTestApp({ userId: HIERARCHY_USER_IDS.manager });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: HIERARCHY_USER_IDS.report,
    } as never);

    const response = await app.inject({
      method: 'PATCH',
      url: '/deliverables/del-1',
      payload: {
        title: 'Updated',
        description: 'Desc',
        roleInDeliverable: 'Lead',
        systemTagIds: ['tag-1'],
        businessImpact: 'MEDIUM',
        improvementPoints: 'Docs',
        userTags: [],
        links: [],
      },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });
});
