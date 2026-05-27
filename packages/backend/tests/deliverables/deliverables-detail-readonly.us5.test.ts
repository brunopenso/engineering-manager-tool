import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setOrganizationalHierarchyResolverForTests } from '../../src/services/organizationalHierarchy.js';
import {
  HIERARCHY_USER_IDS,
  sampleOrganizationalHierarchyResolver,
} from '../../src/test/fixtures/organizationalHierarchy.js';
import * as deliverableService from '../../src/services/deliverableService.js';
import {
  buildDeliverablesTestApp,
  registerDeliverablesTestRoutes,
} from './deliverables-test-app.js';

vi.mock('../../src/services/deliverableService.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/deliverableService.js')>(
    '../../src/services/deliverableService.js',
  );
  return {
    ...actual,
    createDeliverable: vi.fn(),
    listDeliverablesForOwner: vi.fn(),
    getDeliverableById: vi.fn(),
    updateDeliverable: vi.fn(),
    deleteDeliverable: vi.fn(),
  };
});

describe('US5 GET /deliverables/:id read-only', () => {
  beforeEach(() => {
    setOrganizationalHierarchyResolverForTests(sampleOrganizationalHierarchyResolver);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setOrganizationalHierarchyResolverForTests(null);
  });

  it('returns readOnly true for superior detail view', async () => {
    const app = buildDeliverablesTestApp({ userId: HIERARCHY_USER_IDS.manager });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.getDeliverableById).mockResolvedValue({
      id: 'del-1',
      userId: HIERARCHY_USER_IDS.report,
      title: 'Work',
      description: 'Desc',
      roleInDeliverable: 'Lead',
      businessImpact: 'HIGH',
      improvementPoints: 'Improve',
      technicalDescription: null,
      createdAt: new Date('2026-05-26T00:00:00.000Z'),
      updatedAt: new Date('2026-05-26T00:00:00.000Z'),
      systemTags: [],
      userTags: [],
      links: [],
    } as never);

    const response = await app.inject({
      method: 'GET',
      url: '/deliverables/del-1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ readOnly: true });
    await app.close();
  });
});
