import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useAuth } from '../auth/AuthProvider.js';
import { AuthApiError, loginWithGoogle } from '../services/authApi.js';
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

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
              Sign in with Google to access your dashboard
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
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMessage(FALLBACK_ERROR)}
              />
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
