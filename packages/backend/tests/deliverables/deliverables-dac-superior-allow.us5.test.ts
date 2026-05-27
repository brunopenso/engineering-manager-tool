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

vi.mock('../../src/services/deliverableService.js', () => ({
  createDeliverable: vi.fn(),
  listDeliverablesForOwner: vi.fn(),
  getDeliverableById: vi.fn(),
  updateDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  mapDeliverableDetail: vi.fn(),
}));

describe('US5 DAC superior allow', () => {
  beforeEach(() => {
    setOrganizationalHierarchyResolverForTests(sampleOrganizationalHierarchyResolver);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setOrganizationalHierarchyResolverForTests(null);
  });

  it('allows direct manager to list report deliverables', async () => {
    const app = buildDeliverablesTestApp({ userId: HIERARCHY_USER_IDS.manager });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: `/users/${HIERARCHY_USER_IDS.report}/deliverables`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ readOnly: true });
    await app.close();
  });

  it('allows top-of-chain superior to list indirect report deliverables', async () => {
    const app = buildDeliverablesTestApp({ userId: HIERARCHY_USER_IDS.top });
    await registerDeliverablesTestRoutes(app);

    vi.mocked(deliverableService.listDeliverablesForOwner).mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: `/users/${HIERARCHY_USER_IDS.report}/deliverables`,
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });
});
