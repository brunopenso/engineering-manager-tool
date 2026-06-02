import { vi } from 'vitest';
import type { DeliverableSummary } from '../../src/services/deliverablesApi.js';
import type { Tag } from '../../src/services/tagsApi.js';

type ListResponse = {
  deliverables: DeliverableSummary[];
  hasAnyDeliverables?: boolean;
};

export function stubDeliverablesPageFetch(options: {
  list: ListResponse;
  tags?: Tag[];
}) {
  const hasAnyDeliverables =
    options.list.hasAnyDeliverables ?? options.list.deliverables.length > 0;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('/tags/catalog')) {
        return {
          ok: true,
          json: async () => ({ tags: options.tags ?? [] }),
        };
      }

      if (url.includes('/deliverables?')) {
        return {
          ok: true,
          json: async () => ({
            deliverables: options.list.deliverables,
            hasAnyDeliverables,
          }),
        };
      }

      if (url.includes('/deliverables/') && url.includes('DELETE')) {
        return { ok: true, status: 204 };
      }

      return { ok: false, json: async () => ({ code: 'FORBIDDEN', message: 'Unexpected URL' }) };
    }),
  );
}
