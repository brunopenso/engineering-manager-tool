import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setOrganizationalHierarchyResolverForTests } from '../services/organizationalHierarchy.js';
import {
  HIERARCHY_USER_IDS,
  sampleOrganizationalHierarchyResolver,
} from '../test/fixtures/organizationalHierarchy.js';
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

describe('US5 DAC deny', () => {
  beforeEach(() => {
    setOrganizationalHierarchyResolverForTests(sampleOrganizationalHierarchyResolver);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setOrganizationalHierarchyResolverForTests(null);
  });

  it('denies peer access to deliverables', async () => {
    const app = buildDeliverablesTestApp({ userId: HIERARCHY_USER_IDS.report2 });
    await registerDeliverablesTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: `/users/${HIERARCHY_USER_IDS.report}/deliverables`,
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it('denies subordinate upward access to manager deliverables', async () => {
    const app = buildDeliverablesTestApp({ userId: HIERARCHY_USER_IDS.report });
    await registerDeliverablesTestRoutes(app);

    const response = await app.inject({
      method: 'GET',
      url: `/users/${HIERARCHY_USER_IDS.manager}/deliverables`,
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });
});
