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

const FALLBACK_ERROR = 'Authentication failed. Please try again.';

function mapErrorMessage(error: AuthApiError): string {
  switch (error.code) {
    case 'INVALID_TOKEN':
      return 'Google token is invalid.';
    case 'EXPIRED_TOKEN':
      return 'Google token has expired.';
    case 'ISSUER_MISMATCH':
      return 'Google token issuer is not accepted.';
    case 'AUDIENCE_MISMATCH':
      return 'Google token audience does not match this application.';
    default:
      return error.message || FALLBACK_ERROR;
  }
}

function DevLoginSection() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
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
        setDevError('Failed to load development users.');
      });
  }, []);

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
        setDevError(FALLBACK_ERROR);
      }
    } finally {
      setDevLoading(false);
    }
  }

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Divider>Development login</Divider>
      <Alert severity="warning">
        Development-only login. Do not enable in production.
      </Alert>

      {devError && (
        <Alert severity="error" onClose={() => setDevError(null)}>
          {devError}
        </Alert>
      )}

      {devUsers.length > 0 && (
        <FormControl fullWidth disabled={devLoading}>
          <InputLabel id="dev-user-select-label">Existing user</InputLabel>
          <Select
            labelId="dev-user-select-label"
            label="Existing user"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
          >
            {devUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.fullName} ({user.email}) — {user.roles.join(', ')}
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
          Sign in as selected user
        </Button>
      )}

      <TextField
        label="Email"
        value={devEmail}
        onChange={(event) => setDevEmail(event.target.value)}
        disabled={devLoading}
        fullWidth
      />
      <TextField
        label="Full name"
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
        Sign in with email
      </Button>
    </Stack>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { setSession } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonTheme = theme.palette.mode === 'dark' ? 'filled_black' : 'outline';
  const devAuthEnabled = isDevAuthEnabledInWeb();

  async function handleGoogleSuccess(response: CredentialResponse): Promise<void> {
    if (!response.credential) {
      setErrorMessage(FALLBACK_ERROR);
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      setSession({ accessToken: result.accessToken, user: result.user });
      navigate(DEFAULT_APP_ROUTE, { replace: true });
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(mapErrorMessage(error));
      } else {
        setErrorMessage(FALLBACK_ERROR);
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
              Engineering Manager Tool
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in with Google to access
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
                onError={() => setErrorMessage(FALLBACK_ERROR)}
              />
            </Box>

            {devAuthEnabled && <DevLoginSection />}
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
