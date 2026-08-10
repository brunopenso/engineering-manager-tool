import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.js';
import type { AuthUser } from '../auth/AuthProvider.js';
import RoleBadgeList from '../components/profile/RoleBadgeList.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import {
  listUsers,
  updateUserRole,
  UsersApiError,
  type AdminUserListFilters,
} from '../services/usersApi.js';

type ElevatedRole = 'LEADER' | 'ADMINISTRATOR';

const ROLE_FILTER_OPTIONS = ['COLLABORATOR', 'LEADER', 'ADMINISTRATOR'] as const;

type RoleFilterOption = (typeof ROLE_FILTER_OPTIONS)[number];

const MIN_SEARCH_LENGTH = 3;

export default function AdminUsersPage() {
  const { accessToken, user: currentUser, setSession } = useAuth();
  const { t } = useTranslation(['admin', 'common']);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<RoleFilterOption[]>([]);

  const debouncedName = useDebouncedValue(nameFilter, 300);
  const debouncedEmail = useDebouncedValue(emailFilter, 300);

  const listFilters = useMemo<AdminUserListFilters>(() => {
    const filters: AdminUserListFilters = {};
    const name = debouncedName.trim();
    const email = debouncedEmail.trim();

    if (name.length >= MIN_SEARCH_LENGTH) {
      filters.name = name;
    }

    if (email.length >= MIN_SEARCH_LENGTH) {
      filters.email = email;
    }

    if (selectedRoles.length > 0) {
      filters.roles = selectedRoles;
    }

    return filters;
  }, [debouncedName, debouncedEmail, selectedRoles]);

  const hasAppliedFilters =
    selectedRoles.length > 0 ||
    debouncedName.trim().length >= MIN_SEARCH_LENGTH ||
    debouncedEmail.trim().length >= MIN_SEARCH_LENGTH;

  const hasActiveFilters =
    nameFilter.trim().length > 0 || emailFilter.trim().length > 0 || selectedRoles.length > 0;

  function searchHelperText(value: string): string | undefined {
    const length = value.trim().length;
    if (length > 0 && length < MIN_SEARCH_LENGTH) {
      return t('users.searchHelper', { count: MIN_SEARCH_LENGTH });
    }

    return undefined;
  }

  const refreshUsers = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextUsers = await listUsers(accessToken, listFilters);
      setUsers(nextUsers);
    } catch (error) {
      const message = error instanceof UsersApiError ? error.message : t('users.loadError');
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, listFilters]);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  async function handleRoleChange(userId: string, role: ElevatedRole, action: 'GRANT' | 'REVOKE') {
    if (!accessToken) {
      return;
    }

    setErrorMessage(null);

    try {
      const updatedUser = await updateUserRole(accessToken, userId, { role, action });
      await refreshUsers();

      if (currentUser && userId === currentUser.id) {
        setSession({ accessToken, user: updatedUser });
      }
    } catch (error) {
      const message = error instanceof UsersApiError ? error.message : t('users.updateError');
      setErrorMessage(message);
    }
  }

  function hasRole(user: AuthUser, role: ElevatedRole): boolean {
    return user.roles.includes(role);
  }

  function handleRoleFilterChange(event: SelectChangeEvent<string[]>) {
    const value = event.target.value;
    setSelectedRoles(
      typeof value === 'string'
        ? (value.split(',') as RoleFilterOption[])
        : (value as RoleFilterOption[]),
    );
  }

  function handleClearFilters() {
    setNameFilter('');
    setEmailFilter('');
    setSelectedRoles([]);
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              {t('users.title')}
            </Typography>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignItems: 'flex-start',
                }}
              >
                <TextField
                  label={t('fields.name', { ns: 'common' })}
                  placeholder={t('users.namePlaceholder')}
                  value={nameFilter}
                  onChange={(event) => setNameFilter(event.target.value)}
                  size="small"
                  sx={{ minWidth: 220, flex: '1 1 220px' }}
                  helperText={searchHelperText(nameFilter)}
                  slotProps={{ htmlInput: { 'data-testid': 'admin-users-name-filter' } }}
                />
                <TextField
                  label={t('fields.email', { ns: 'common' })}
                  placeholder={t('users.emailPlaceholder')}
                  value={emailFilter}
                  onChange={(event) => setEmailFilter(event.target.value)}
                  size="small"
                  sx={{ minWidth: 220, flex: '1 1 220px' }}
                  helperText={searchHelperText(emailFilter)}
                  slotProps={{ htmlInput: { 'data-testid': 'admin-users-email-filter' } }}
                />
                <FormControl size="small" sx={{ minWidth: 240, flex: '1 1 240px' }}>
                  <InputLabel id="admin-users-role-filter-label" shrink>
                    {t('fields.roles', { ns: 'common' })}
                  </InputLabel>
                  <Select
                    labelId="admin-users-role-filter-label"
                    multiple
                    value={selectedRoles}
                    onChange={handleRoleFilterChange}
                    input={<OutlinedInput label={t('fields.roles', { ns: 'common' })} />}
                    renderValue={(selected) => (
                      <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        {selected.map((role) => (
                          <Chip
                            key={role}
                            size="small"
                            label={t(`roles.${role}`, { ns: 'common' })}
                          />
                        ))}
                      </Stack>
                    )}
                    data-testid="admin-users-role-filter"
                  >
                    {ROLE_FILTER_OPTIONS.map((role) => (
                      <MenuItem key={role} value={role}>
                        {t(`roles.${role}`, { ns: 'common' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {hasActiveFilters ? (
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    data-testid="admin-users-clear-filters"
                    sx={{ alignSelf: 'center' }}
                  >
                    {t('actions.clearAllFilters', { ns: 'common' })}
                  </Button>
                ) : null}
              </Box>
            </Paper>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            {isLoading ? (
              <Typography color="text.secondary" data-testid="admin-users-loading">
                {t('loading.users', { ns: 'common' })}
              </Typography>
            ) : users.length === 0 ? (
              <Box data-testid="admin-users-empty-state">
                {hasAppliedFilters ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      {t('users.emptyFiltered.title')}
                    </Typography>
                    <Typography color="text.secondary">{t('users.emptyFiltered.body')}</Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h6" gutterBottom>
                      {t('users.emptyNone.title')}
                    </Typography>
                    <Typography color="text.secondary">{t('users.emptyNone.body')}</Typography>
                  </>
                )}
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('fields.name', { ns: 'common' })}</TableCell>
                    <TableCell>{t('fields.email', { ns: 'common' })}</TableCell>
                    <TableCell>{t('fields.roles', { ns: 'common' })}</TableCell>
                    <TableCell align="right">{t('actions.actions', { ns: 'common' })}</TableCell>
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
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
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
                            {hasRole(user, 'LEADER')
                              ? t('users.revokeLeader')
                              : t('users.grantLeader')}
                          </Button>
                          <Button
                            size="small"
                            variant={hasRole(user, 'ADMINISTRATOR') ? 'outlined' : 'contained'}
                            onClick={() =>
                              void handleRoleChange(
                                user.id,
                                'ADMINISTRATOR',
                                hasRole(user, 'ADMINISTRATOR') ? 'REVOKE' : 'GRANT',
                              )
                            }
                          >
                            {hasRole(user, 'ADMINISTRATOR')
                              ? t('users.revokeAdmin')
                              : t('users.grantAdmin')}
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
