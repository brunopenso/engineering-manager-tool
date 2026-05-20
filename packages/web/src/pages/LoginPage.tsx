import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
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

  async function handleGoogleSuccess(response: CredentialResponse): Promise<void> {
    if (!response.credential) {
      setErrorMessage(FALLBACK_ERROR);
      return;
    }

    try {
      const result = await loginWithGoogle(response.credential);
      setSession({ accessToken: result.accessToken, user: result.user });
      navigate(DEFAULT_APP_ROUTE, { replace: true });
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(mapErrorMessage(error));
        return;
      }

      setErrorMessage(FALLBACK_ERROR);
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <p>Sign in with Google to continue.</p>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => setErrorMessage(FALLBACK_ERROR)}
      />
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </main>
  );
}
