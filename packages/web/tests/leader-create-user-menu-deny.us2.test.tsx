import { describe, expect, it } from 'vitest';
import { getVisibleShellMenuOptions } from '../src/routes/shellOptions.js';
import { testUser } from '../src/test/renderWithProviders.js';

describe('US2 non-leader menu visibility', () => {
  it('does not show leader create user menu option', () => {
    const labels = getVisibleShellMenuOptions(testUser).map((option) => option.label);
    expect(labels).not.toContain('Create user');
  });
});
