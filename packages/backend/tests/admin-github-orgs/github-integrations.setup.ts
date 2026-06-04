/** Shared constants for admin GitHub integrations route tests. */
export const ADMIN_AUTH = {
  userId: 'admin-1',
  email: 'admin@example.com',
  fullName: 'Admin',
  roles: ['COLLABORATOR', 'ADMINISTRATOR'],
} as const;

export const COLLABORATOR_AUTH = {
  userId: 'user-1',
  email: 'user@example.com',
  fullName: 'User',
  roles: ['COLLABORATOR'],
} as const;
