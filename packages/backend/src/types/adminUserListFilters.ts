import type { UserRoleType } from '../auth/types.js';

export type AdminUserListFilters = {
  name?: string;
  email?: string;
  roles?: UserRoleType[];
};
