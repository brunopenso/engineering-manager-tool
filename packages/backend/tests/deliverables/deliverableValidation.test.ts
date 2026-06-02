import { describe, expect, it } from 'vitest';
import {
  DeliverableValidationError,
  validateDeliverableWriteInput,
  type DeliverableWriteInput,
} from '../../src/services/deliverableValidation.js';

function validInput(overrides: Partial<DeliverableWriteInput> = {}): DeliverableWriteInput {
  return {
    title: 'Title',
    description: 'Description',
    roleInDeliverable: 'Lead',
    systemTagIds: [],
    businessImpact: 'HIGH',
    improvementPoints: 'Improve',
    ...overrides,
  };
}

describe('validateDeliverableWriteInput system tags', () => {
  it('accepts empty systemTagIds', () => {
    const result = validateDeliverableWriteInput(validInput({ systemTagIds: [] }));
    expect(result.systemTagIds).toEqual([]);
  });

  it('dedupes and trims systemTagIds when provided', () => {
    const result = validateDeliverableWriteInput(
      validInput({ systemTagIds: [' tag-1 ', 'tag-1', 'tag-2'] }),
    );
    expect(result.systemTagIds).toEqual(['tag-1', 'tag-2']);
  });

  it('rejects non-array systemTagIds', () => {
    expect(() =>
      validateDeliverableWriteInput(validInput({ systemTagIds: 'tag-1' as unknown as string[] })),
    ).toThrow(DeliverableValidationError);
  });

  it('rejects more than 20 systemTagIds', () => {
    expect(() =>
      validateDeliverableWriteInput(
        validInput({ systemTagIds: Array.from({ length: 21 }, (_, i) => `tag-${i}`) }),
      ),
    ).toThrow(/At most 20 system tags are allowed/);
  });

  it('still rejects missing title when systemTagIds is empty', () => {
    expect(() =>
      validateDeliverableWriteInput(validInput({ title: '   ', systemTagIds: [] })),
    ).toThrow('Title is required.');
  });
});
