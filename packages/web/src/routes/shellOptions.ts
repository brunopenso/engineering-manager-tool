import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AuthUser } from '../auth/AuthProvider.js';
import { isAdministrator, isLeader } from '../auth/roleGuards.js';
import i18n from '../i18n/config.js';

export const LOGIN_ROUTE = '/login';
export const ROOT_LOGIN_ROUTE = '/';
export const DEFAULT_APP_ROUTE = '/app';
export const PROFILE_ROUTE = '/app/profile';
export const ADMIN_USERS_ROUTE = '/app/admin/users';
export const ADMIN_TAGS_ROUTE = '/app/admin/tags';
export const ADMIN_GITHUB_ROUTE = '/app/admin/github';
export const LEADER_HIERARCHY_ROUTE = '/app/leader/hierarchy';
export const LEADER_TEAM_DELIVERABLES_ROUTE = '/app/leader/team-deliverables';
export const LEADER_TEAM_ANALYTICS_ROUTE = '/app/leader/team-analytics';
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

type ShellMenuOptionDef = {
  id: string;
  labelKey: string;
  route: string;
  available: boolean;
};

type ShellMenuSectionDef = {
  id: string;
  titleKey?: string;
  options: ShellMenuOptionDef[];
};

const BASE_SHELL_MENU_OPTIONS: ShellMenuOptionDef[] = [
  { id: 'home', labelKey: 'menu.home', route: '/app', available: true },
  { id: 'profile', labelKey: 'menu.profile', route: PROFILE_ROUTE, available: true },
  {
    id: 'deliverables',
    labelKey: 'menu.deliverables',
    route: DELIVERABLES_ROUTE,
    available: true,
  },
];

const ADMIN_SHELL_MENU_OPTIONS: ShellMenuOptionDef[] = [
  {
    id: 'admin-users',
    labelKey: 'menu.userRoles',
    route: ADMIN_USERS_ROUTE,
    available: true,
  },
  { id: 'admin-tags', labelKey: 'menu.tags', route: ADMIN_TAGS_ROUTE, available: true },
  {
    id: 'admin-github',
    labelKey: 'menu.githubIntegration',
    route: ADMIN_GITHUB_ROUTE,
    available: true,
  },
];

const LEADER_SHELL_MENU_OPTIONS: ShellMenuOptionDef[] = [
  {
    id: 'leader-team-deliverables',
    labelKey: 'menu.teamDeliverables',
    route: LEADER_TEAM_DELIVERABLES_ROUTE,
    available: true,
  },
  {
    id: 'leader-team-analytics',
    labelKey: 'menu.teamAnalytics',
    route: LEADER_TEAM_ANALYTICS_ROUTE,
    available: true,
  },
  {
    id: 'leader-hierarchy',
    labelKey: 'menu.hierarchyManagement',
    route: LEADER_HIERARCHY_ROUTE,
    available: true,
  },
];

function getVisibleShellMenuSectionDefs(user: AuthUser | null): ShellMenuSectionDef[] {
  const sections: ShellMenuSectionDef[] = [
    { id: 'collaborator', options: [...BASE_SHELL_MENU_OPTIONS] },
  ];

  if (isLeader(user)) {
    sections.push({
      id: 'leader',
      titleKey: 'sections.leader',
      options: [...LEADER_SHELL_MENU_OPTIONS],
    });
  }

  if (isAdministrator(user)) {
    sections.push({
      id: 'administration',
      titleKey: 'sections.administration',
      options: [...ADMIN_SHELL_MENU_OPTIONS],
    });
  }

  return sections;
}

function translateSections(
  sections: ShellMenuSectionDef[],
  translate: (key: string) => string,
): ShellMenuSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.titleKey ? translate(section.titleKey) : undefined,
    options: section.options.map((option) => ({
      id: option.id,
      label: translate(option.labelKey),
      route: option.route,
      available: option.available,
    })),
  }));
}

export function useVisibleShellMenuSections(user: AuthUser | null): ShellMenuSection[] {
  const { t } = useTranslation('shell');
  const sectionDefs = useMemo(() => getVisibleShellMenuSectionDefs(user), [user]);

  return useMemo(
    () => translateSections(sectionDefs, (key) => t(key)),
    [sectionDefs, t],
  );
}

export function getVisibleShellMenuSections(user: AuthUser | null): ShellMenuSection[] {
  return translateSections(getVisibleShellMenuSectionDefs(user), (key) =>
    i18n.t(key, { ns: 'shell' }),
  );
}

export function getVisibleShellMenuOptions(user: AuthUser | null): ShellMenuOption[] {
  return getVisibleShellMenuSections(user).flatMap((section) => section.options);
}

/** @deprecated Use useVisibleShellMenuSections(user) for role-aware navigation */
export const SHELL_MENU_OPTIONS: ShellMenuOption[] = translateSections(
  [{ id: 'collaborator', options: BASE_SHELL_MENU_OPTIONS }],
  (key) => i18n.t(key, { ns: 'shell' }),
)[0]!.options;
