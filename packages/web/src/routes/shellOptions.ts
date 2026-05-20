export const LOGIN_ROUTE = '/login';
export const ROOT_LOGIN_ROUTE = '/';
export const DEFAULT_APP_ROUTE = '/app';

export type ShellMenuOption = {
  id: string;
  label: string;
  route: string;
  available: boolean;
};

export const SHELL_MENU_OPTIONS: ShellMenuOption[] = [
  {
    id: 'home',
    label: 'Home',
    route: '/app',
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
