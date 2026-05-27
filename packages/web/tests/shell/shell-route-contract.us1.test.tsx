import { describe, expect, it } from 'vitest';
import { shellRouteContract } from '../../src/test/fixtures/shellRouteContract.js';

describe('US1 route contract', () => {
  it('defines /app as the authenticated default route', () => {
    expect(shellRouteContract.authenticatedDefaultRoute).toBe('/app');
  });
});
