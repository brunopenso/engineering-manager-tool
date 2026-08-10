import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '../auth/AuthProvider.js';
import {
  AuthApiError,
  isDevAuthEnabledInWeb,
  listDevUsers,
  loginWithDevUser,
  loginWithGoogle,
  type DevAuthUser,
} from '../services/authApi.js';
import { DEFAULT_APP_ROUTE } from '../routes/shellOptions.js';

function mapErrorMessage(error: AuthApiError, t: TFunction<'auth'>): string {
  switch (error.code) {
    case 'INVALID_TOKEN':
      return t('errors.invalidToken');
    case 'EXPIRED_TOKEN':
      return t('errors.expiredToken');
    case 'ISSUER_MISMATCH':
      return t('errors.issuerMismatch');
    case 'AUDIENCE_MISMATCH':
      return t('errors.audienceMismatch');
    default:
      return error.message || t('errors.authFailed');
  }
}

function DevLoginSection() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { t } = useTranslation(['auth', 'common']);
  const [devUsers, setDevUsers] = useState<DevAuthUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [devEmail, setDevEmail] = useState('');
  const [devFullName, setDevFullName] = useState('');
  const [devError, setDevError] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  useEffect(() => {
    void listDevUsers()
      .then((users) => {
        setDevUsers(users);
        if (users.length > 0) {
          setSelectedUserId(users[0].id);
        }
      })
      .catch(() => {
        setDevError(t('dev.loadUsersFailed'));
      });
  }, [t]);

  async function handleDevLogin(input: {
    userId?: string;
    email?: string;
    fullName?: string;
  }): Promise<void> {
    setDevLoading(true);
    setDevError(null);

    try {
      const result = await loginWithDevUser(input);
      setSession({ accessToken: result.accessToken, user: result.user });
      navigate(DEFAULT_APP_ROUTE, { replace: true });
    } catch (error) {
      if (error instanceof AuthApiError) {
        setDevError(error.message);
      } else {
        setDevError(t('errors.authFailed'));
      }
    } finally {
      setDevLoading(false);
    }
  }

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Divider>{t('dev.divider')}</Divider>
      <Alert severity="warning">{t('dev.warning')}</Alert>

      {devError && (
        <Alert severity="error" onClose={() => setDevError(null)}>
          {devError}
        </Alert>
      )}

      {devUsers.length > 0 && (
        <FormControl fullWidth disabled={devLoading}>
          <InputLabel id="dev-user-select-label">{t('dev.existingUser')}</InputLabel>
          <Select
            labelId="dev-user-select-label"
            label={t('dev.existingUser')}
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
          >
            {devUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {t('dev.userOption', {
                  fullName: user.fullName,
                  email: user.email,
                  roles: user.roles.map((role) => t(`roles.${role}`, { ns: 'common' })).join(', '),
                })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {devUsers.length > 0 && (
        <Button
          variant="outlined"
          disabled={devLoading || !selectedUserId}
          onClick={() => void handleDevLogin({ userId: selectedUserId })}
        >
          {t('dev.signInSelected')}
        </Button>
      )}

      <TextField
        label={t('fields.email', { ns: 'common' })}
        value={devEmail}
        onChange={(event) => setDevEmail(event.target.value)}
        disabled={devLoading}
        fullWidth
      />
      <TextField
        label={t('dev.fullName')}
        value={devFullName}
        onChange={(event) => setDevFullName(event.target.value)}
        disabled={devLoading}
        fullWidth
      />
      <Button
        variant="outlined"
        disabled={devLoading || !devEmail.trim()}
        onClick={() =>
          void handleDevLogin({
            email: devEmail.trim(),
            fullName: devFullName.trim() || undefined,
          })
        }
      >
        {t('dev.signInEmail')}
      </Button>
    </Stack>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { setSession } = useAuth();
  const { t } = useTranslation(['auth', 'shell']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonTheme = theme.palette.mode === 'dark' ? 'filled_black' : 'outline';
  const devAuthEnabled = isDevAuthEnabledInWeb();

  async function handleGoogleSuccess(response: CredentialResponse): Promise<void> {
    if (!response.credential) {
      setErrorMessage(t('errors.authFailed'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      setSession({ accessToken: result.accessToken, user: result.user });
      navigate(DEFAULT_APP_ROUTE, { replace: true });
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(mapErrorMessage(error, t));
      } else {
        setErrorMessage(t('errors.authFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            width: '100%',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                marginBottom: 1,
                color: 'primary.main',
              }}
            >
              {t('appTitle', { ns: 'shell' })}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('subtitle')}
            </Typography>
          </Box>

          <Stack spacing={2} sx={{ width: '100%' }}>
            {errorMessage && (
              <Alert severity="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {isLoading && (
                <CircularProgress
                  size={40}
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    marginLeft: '-20px',
                  }}
                />
              )}
              <GoogleLogin
                theme={googleButtonTheme}
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMessage(t('errors.authFailed'))}
              />
            </Box>

            {devAuthEnabled && <DevLoginSection />}
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
