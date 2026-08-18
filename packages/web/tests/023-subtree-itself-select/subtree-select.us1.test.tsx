import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import type { ComponentProps } from 'react';
import i18n from '../../src/i18n/index.js';
import TeamMemberHierarchyPicker from '../../src/components/team-deliverables/TeamMemberHierarchyPicker.js';
import type { HierarchyViewNode } from '../../src/services/usersApi.js';

const reports: HierarchyViewNode[] = [
  {
    id: 'alice',
    displayName: 'Alice',
    email: 'alice@example.com',
    isLeader: true,
    children: [
      {
        id: 'bob',
        displayName: 'Bob',
        email: 'bob@example.com',
        isLeader: false,
        children: [],
      },
    ],
  },
  {
    id: 'eve',
    displayName: 'Eve',
    email: 'eve@example.com',
    isLeader: false,
    children: [],
  },
];

function renderPicker(
  props: Partial<ComponentProps<typeof TeamMemberHierarchyPicker>> & {
    onChange?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const onChange = props.onChange ?? vi.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <TeamMemberHierarchyPicker
        reports={reports}
        selectedUserId={props.selectedUserId ?? ''}
        selectedScope={props.selectedScope ?? 'subtree'}
        onChange={onChange}
      />
    </I18nextProvider>,
  );
  return { onChange };
}

describe('US1 subtree select picker', () => {
  it('emits subtree scope when selecting a person with reports', async () => {
    const { onChange } = renderPicker();

    await userEvent.click(screen.getByTestId('team-member-select'));
    await userEvent.click(screen.getByTestId('team-member-option-alice'));

    expect(onChange).toHaveBeenCalledWith({ userId: 'alice', scope: 'subtree' });
  });

  it('emits itself scope for leaf people', async () => {
    const { onChange } = renderPicker();

    await userEvent.click(screen.getByTestId('team-member-select'));
    await userEvent.click(screen.getByTestId('team-member-option-eve'));

    expect(onChange).toHaveBeenCalledWith({ userId: 'eve', scope: 'itself' });
  });
});
