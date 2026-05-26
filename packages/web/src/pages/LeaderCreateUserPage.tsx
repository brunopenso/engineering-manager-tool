import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthProvider.js';
import { createUser, UsersApiError } from '../services/usersApi.js';

const ROLE_OPTIONS = ['COLLABORATOR', 'LEADER', 'ADMINISTRATOR'] as const;

export default function LeaderCreateUserPage() {
  const { accessToken, user } = useAuth();
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
      setSuccessMessage(
        `User ${created.fullName} created successfully. Leader assigned automatically to you.`,
      );
      setFullName('');
      setEmail('');
      setRole('COLLABORATOR');
    } catch (error) {
      const message = error instanceof UsersApiError ? error.message : 'Unable to create user.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" component="h1">
                Create new user
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Leader assigned automatically to you ({user?.fullName ?? 'current leader'}).
              </Typography>
            </Box>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  fullWidth
                  type="email"
                />
                <TextField
                  select
                  label="User role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  fullWidth
                >
                  {ROLE_OPTIONS.map((value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </TextField>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create user'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
