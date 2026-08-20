import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
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

describe('US2 Itself option', () => {
  it('shows Itself for parents and emits itself scope', async () => {
    const onChange = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <TeamMemberHierarchyPicker
          reports={reports}
          selectedUserId=""
          selectedScope="subtree"
          onChange={onChange}
        />
      </I18nextProvider>,
    );

    await userEvent.click(screen.getByTestId('team-member-select'));
    expect(screen.getByTestId('team-member-itself-alice')).toBeInTheDocument();
    expect(screen.queryByTestId('team-member-itself-eve')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('team-member-itself-alice'));
    expect(onChange).toHaveBeenCalledWith({ userId: 'alice', scope: 'itself' });
  });
});
