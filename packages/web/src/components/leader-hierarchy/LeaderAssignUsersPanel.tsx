import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider.js';
import {
  assignLeaderToUser,
  searchOrphanUsers,
  type OrphanUserSummary,
  UsersApiError,
} from '../../services/usersApi.js';

export default function LeaderAssignUsersPanel() {
  const { accessToken, user } = useAuth();
  const { t } = useTranslation('leader');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<OrphanUserSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSearching(true);

    try {
      const result = await searchOrphanUsers(accessToken, query);
      setUsers(result);
      setHasSearched(true);
    } catch (error) {
      const message = error instanceof UsersApiError ? error.message : t('assignUsers.searchError');
      setErrorMessage(message);
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAssign(userId: string) {
    if (!accessToken) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setAssigningUserId(userId);

    try {
      await assignLeaderToUser(accessToken, userId);
      setUsers((current) => current.filter((entry) => entry.id !== userId));
      setSuccessMessage(t('assignUsers.success'));
    } catch (error) {
      const message = error instanceof UsersApiError ? error.message : t('assignUsers.assignError');
      setErrorMessage(message);
    } finally {
      setAssigningUserId(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        {t('assignUsers.intro', {
          name: user?.fullName ?? t('assignUsers.hierarchyFallback'),
        })}
      </Typography>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <Box component="form" onSubmit={handleSearch}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label={t('assignUsers.searchLabel')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            fullWidth
            helperText={t('assignUsers.searchHelper')}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isSearching}
            sx={{ minWidth: 140 }}
          >
            {isSearching ? t('assignUsers.searching') : t('assignUsers.search')}
          </Button>
        </Stack>
      </Box>

      {isSearching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {users.map((candidate) => (
            <Paper
              key={candidate.id}
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1.5,
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
              }}
            >
              <Box>
                <Typography variant="subtitle1">{candidate.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {candidate.email}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => handleAssign(candidate.id)}
                disabled={assigningUserId === candidate.id}
              >
                {assigningUserId === candidate.id
                  ? t('assignUsers.assigning')
                  : t('assignUsers.assignToMe')}
              </Button>
            </Paper>
          ))}

          {hasSearched && users.length === 0 && !errorMessage && (
            <Alert severity="info">{t('assignUsers.noResults')}</Alert>
          )}
        </Stack>
      )}
    </Stack>
  );
}
