import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { AUTH_ERROR_CODES, type AuthFailureResponse } from '../auth/types.js';

const client = new OAuth2Client();

type GoogleIdentity = {
  id: string;
  email: string;
  fullName: string;
};

type ValidationResult =
  { ok: true; identity: GoogleIdentity } | { ok: false; error: AuthFailureResponse };

const VALID_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

function buildFailure(code: AuthFailureResponse['code'], message: string): ValidationResult {
  return {
    ok: false,
    error: { code, message },
  };
}

function mapTokenVerificationError(error: unknown): ValidationResult {
  const text = error instanceof Error ? error.message.toLowerCase() : '';

  if (text.includes('expired') || text.includes('too late')) {
    return buildFailure(AUTH_ERROR_CODES.EXPIRED_TOKEN, 'Google token has expired.');
  }

  if (text.includes('wrong recipient') || text.includes('audience')) {
    return buildFailure(
      AUTH_ERROR_CODES.AUDIENCE_MISMATCH,
      'Google token audience does not match this application.',
    );
  }

  if (text.includes('issuer')) {
    return buildFailure(AUTH_ERROR_CODES.ISSUER_MISMATCH, 'Google token issuer is not accepted.');
  }

  return buildFailure(AUTH_ERROR_CODES.INVALID_TOKEN, 'Google token is invalid.');
}

function validatePayload(payload: TokenPayload | undefined, audience: string): ValidationResult {
  if (!payload?.sub || !payload.email || !payload.name) {
    return buildFailure(AUTH_ERROR_CODES.INVALID_TOKEN, 'Google token is invalid.');
  }

  if (!VALID_ISSUERS.has(payload.iss ?? '')) {
    return buildFailure(AUTH_ERROR_CODES.ISSUER_MISMATCH, 'Google token issuer is not accepted.');
  }

  if (payload.aud !== audience) {
    return buildFailure(
      AUTH_ERROR_CODES.AUDIENCE_MISMATCH,
      'Google token audience does not match this application.',
    );
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return buildFailure(AUTH_ERROR_CODES.EXPIRED_TOKEN, 'Google token has expired.');
  }

  return {
    ok: true,
    identity: {
      id: payload.sub,
      email: payload.email,
      fullName: payload.name,
    },
  };
}

export async function validateGoogleIdToken(idToken: string): Promise<ValidationResult> {
  const audience = process.env.GOOGLE_CLIENT_ID;

  if (!audience) {
    return buildFailure(
      AUTH_ERROR_CODES.AUDIENCE_MISMATCH,
      'Google token audience does not match this application.',
    );
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience,
    });

    return validatePayload(ticket.getPayload(), audience);
  } catch (error) {
    return mapTokenVerificationError(error);
  }
}
