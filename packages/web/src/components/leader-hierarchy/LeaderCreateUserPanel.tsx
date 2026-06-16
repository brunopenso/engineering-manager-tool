import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider.js';
import { createUser, UsersApiError } from '../../services/usersApi.js';

const ROLE_OPTIONS = ['COLLABORATOR', 'LEADER', 'ADMINISTRATOR'] as const;

export default function LeaderCreateUserPanel() {
  const { accessToken, user } = useAuth();
  const { t } = useTranslation(['leader', 'common']);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('COLLABORATOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const created = await createUser(accessToken, { fullName, email, role });
      setSuccessMessage(t('createUser.success', { fullName: created.fullName }));
      setFullName('');
      setEmail('');
      setRole('COLLABORATOR');
    } catch (error) {
      const message = error instanceof UsersApiError ? error.message : t('createUser.error');
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        {t('createUser.intro', {
          name: user?.fullName ?? t('createUser.currentLeaderFallback'),
        })}
      </Typography>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label={t('createUser.fullName')}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label={t('fields.email', { ns: 'common' })}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
            type="email"
          />
          <TextField
            select
            label={t('createUser.userRole')}
            value={role}
            onChange={(event) => setRole(event.target.value)}
            fullWidth
          >
            {ROLE_OPTIONS.map((value) => (
              <MenuItem key={value} value={value}>
                {t(`roles.${value}`, { ns: 'common' })}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? t('createUser.creating') : t('createUser.create')}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
