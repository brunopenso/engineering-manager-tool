import type { AuthUser } from '../auth/AuthProvider.js';
import { isAdministrator, isLeader } from '../auth/roleGuards.js';

export const LOGIN_ROUTE = '/login';
export const ROOT_LOGIN_ROUTE = '/';
export const DEFAULT_APP_ROUTE = '/app';
export const PROFILE_ROUTE = '/app/profile';
export const ADMIN_USERS_ROUTE = '/app/admin/users';
export const ADMIN_TAGS_ROUTE = '/app/admin/tags';
export const LEADER_HIERARCHY_ROUTE = '/app/leader/hierarchy';
export const LEADER_HIERARCHY_VIEW_ROUTE = '/app/leader/hierarchy/view';
export const LEADER_TEAM_DELIVERABLES_ROUTE = '/app/leader/team-deliverables';
export const DELIVERABLES_ROUTE = '/app/deliverables';
export const DELIVERABLES_VIEW_ROUTE = '/app/deliverables/view';

export type ShellMenuOption = {
  id: string;
  label: string;
  route: string;
  available: boolean;
};

export type ShellMenuSection = {
  id: string;
  title?: string;
  options: ShellMenuOption[];
};

const BASE_SHELL_MENU_OPTIONS: ShellMenuOption[] = [
  {
    id: 'home',
    label: 'Home',
    route: '/app',
    available: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    route: PROFILE_ROUTE,
    available: true,
  },
  {
    id: 'deliverables',
    label: 'Deliverables',
    route: DELIVERABLES_ROUTE,
    available: true,
  },
];

const ADMIN_SHELL_MENU_OPTIONS: ShellMenuOption[] = [
  {
    id: 'admin-users',
    label: 'User roles',
    route: ADMIN_USERS_ROUTE,
    available: true,
  },
  {
    id: 'admin-tags',
    label: 'Tags',
    route: ADMIN_TAGS_ROUTE,
    available: true,
  },
];

const LEADER_SHELL_MENU_OPTIONS: ShellMenuOption[] = [
  {
    id: 'leader-team-deliverables',
    label: 'Team Deliverables',
    route: LEADER_TEAM_DELIVERABLES_ROUTE,
    available: true,
  },
  {
    id: 'leader-hierarchy-view',
    label: 'Hierarchy View',
    route: LEADER_HIERARCHY_VIEW_ROUTE,
    available: true,
  },
  {
    id: 'leader-hierarchy',
    label: 'Hierarchy Management',
    route: LEADER_HIERARCHY_ROUTE,
    available: true,
  },
];

export function getVisibleShellMenuSections(user: AuthUser | null): ShellMenuSection[] {
  const sections: ShellMenuSection[] = [
    { id: 'collaborator', options: [...BASE_SHELL_MENU_OPTIONS] },
  ];

  if (isLeader(user)) {
    sections.push({
      id: 'leader',
      title: 'Leader',
      options: [...LEADER_SHELL_MENU_OPTIONS],
    });
  }

  if (isAdministrator(user)) {
    sections.push({
      id: 'administration',
      title: 'Administration',
      options: [...ADMIN_SHELL_MENU_OPTIONS],
    });
  }

  return sections;
}

export function getVisibleShellMenuOptions(user: AuthUser | null): ShellMenuOption[] {
  return getVisibleShellMenuSections(user).flatMap((section) => section.options);
}

/** @deprecated Use getVisibleShellMenuSections(user) for role-aware navigation */
export const SHELL_MENU_OPTIONS = BASE_SHELL_MENU_OPTIONS;
