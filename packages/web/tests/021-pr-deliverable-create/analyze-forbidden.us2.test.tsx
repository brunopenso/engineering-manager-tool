import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('021 analyze forbidden contract (US2)', () => {
  it('documents 403 for unauthorized PR ids in OpenAPI contract', () => {
    const contract = readFileSync(
      resolve(
        process.cwd(),
        '../../specs/021-pr-deliverable-create/contracts/pr-deliverable-create-api.yaml',
      ),
      'utf8',
    );
    expect(contract).toContain("'403'");
    expect(contract).toContain('not in the caller');
  });
});
