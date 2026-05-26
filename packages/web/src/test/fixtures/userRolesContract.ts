export const userRolesContract = {
  roleTypes: ['COLLABORATOR', 'LEADER', 'ADMINISTRATOR'] as const,
  defaultRoles: ['COLLABORATOR'] as const,
  profileRoute: '/app/profile',
  adminUsersRoute: '/app/admin/users',
};
