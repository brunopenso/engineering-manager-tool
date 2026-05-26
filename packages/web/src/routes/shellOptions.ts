import type { AuthUser } from '../auth/AuthProvider.js';
import { isAdministrator } from '../auth/roleGuards.js';

export const LOGIN_ROUTE = '/login';
export const ROOT_LOGIN_ROUTE = '/';
export const DEFAULT_APP_ROUTE = '/app';
export const PROFILE_ROUTE = '/app/profile';
export const ADMIN_USERS_ROUTE = '/app/admin/users';

export type ShellMenuOption = {
  id: string;
  label: string;
  route: string;
  available: boolean;
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
    id: 'updates',
    label: 'Team Updates',
    route: '/app/updates',
    available: true,
  },
  {
    id: 'reports',
    label: 'Reports',
    route: '/app/unavailable',
    available: false,
  },
];

const ADMIN_SHELL_MENU_OPTION: ShellMenuOption = {
  id: 'admin-users',
  label: 'User roles',
  route: ADMIN_USERS_ROUTE,
  available: true,
};

export function getVisibleShellMenuOptions(user: AuthUser | null): ShellMenuOption[] {
  const options = [...BASE_SHELL_MENU_OPTIONS];

  if (isAdministrator(user)) {
    options.push(ADMIN_SHELL_MENU_OPTION);
  }

  return options;
}

/** @deprecated Use getVisibleShellMenuOptions(user) for role-aware navigation */
export const SHELL_MENU_OPTIONS = BASE_SHELL_MENU_OPTIONS;
