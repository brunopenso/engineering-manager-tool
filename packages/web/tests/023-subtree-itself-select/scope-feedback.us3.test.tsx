import { render, screen } from '@testing-library/react';
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
];

describe('US3 scope feedback', () => {
  it('shows team vs itself labels in the closed picker', () => {
    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <TeamMemberHierarchyPicker
          reports={reports}
          selectedUserId="alice"
          selectedScope="subtree"
          onChange={vi.fn()}
        />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('team-member-select')).toHaveValue('Alice (team)');
    expect(screen.getByTestId('team-member-select')).toHaveAttribute('data-scope', 'subtree');

    rerender(
      <I18nextProvider i18n={i18n}>
        <TeamMemberHierarchyPicker
          reports={reports}
          selectedUserId="alice"
          selectedScope="itself"
          onChange={vi.fn()}
        />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('team-member-select')).toHaveValue('Alice (itself)');
    expect(screen.getByTestId('team-member-select')).toHaveAttribute('data-scope', 'itself');
  });
});
