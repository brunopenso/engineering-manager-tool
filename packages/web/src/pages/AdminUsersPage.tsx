import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthProvider.js';
import RoleBadgeList from '../components/profile/RoleBadgeList.js';
import { listUsers, updateUserRole, UsersApiError } from '../services/usersApi.js';
import type { AuthUser } from '../auth/AuthProvider.js';

type ElevatedRole = 'LEADER' | 'ADMINISTRATOR';

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUsers() {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextUsers = await listUsers(accessToken);
      setUsers(nextUsers);
    } catch (error) {
      const message =
        error instanceof UsersApiError
          ? error.message
          : 'Unable to load users.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshUsers();
  }, [accessToken]);

  async function handleRoleChange(
    userId: string,
    role: ElevatedRole,
    action: 'GRANT' | 'REVOKE',
  ) {
    if (!accessToken) {
      return;
    }

    setErrorMessage(null);

    try {
      await updateUserRole(accessToken, userId, { role, action });
      await refreshUsers();
    } catch (error) {
      const message =
        error instanceof UsersApiError
          ? error.message
          : 'Unable to update role.';
      setErrorMessage(message);
    }
  }

  function hasRole(user: AuthUser, role: ElevatedRole): boolean {
    return user.roles.includes(role);
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              User role management
            </Typography>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {isLoading ? (
              <Typography color="text.secondary">Loading users...</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <RoleBadgeList roles={user.roles} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant={hasRole(user, 'LEADER') ? 'outlined' : 'contained'}
                            onClick={() =>
                              void handleRoleChange(
                                user.id,
                                'LEADER',
                                hasRole(user, 'LEADER') ? 'REVOKE' : 'GRANT',
                              )
                            }
                          >
                            {hasRole(user, 'LEADER') ? 'Revoke Leader' : 'Grant Leader'}
                          </Button>
                          <Button
                            size="small"
                            variant={
                              hasRole(user, 'ADMINISTRATOR') ? 'outlined' : 'contained'
                            }
                            onClick={() =>
                              void handleRoleChange(
                                user.id,
                                'ADMINISTRATOR',
                                hasRole(user, 'ADMINISTRATOR') ? 'REVOKE' : 'GRANT',
                              )
                            }
                          >
                            {hasRole(user, 'ADMINISTRATOR')
                              ? 'Revoke Admin'
                              : 'Grant Admin'}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
