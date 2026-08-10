import { describe, expect, it } from 'vitest';
import {
  GithubAppCredentialsError,
  normalizeGithubAppPrivateKey,
  resolveGithubAppCredentials,
} from '../../src/services/githubApiClient.js';

describe('GitHub App credential resolution', () => {
  it('resolves APP_ID, PRIVATE_KEY, and INSTALLATION_ID for an organization', () => {
    const credentials = resolveGithubAppCredentials('brunopenso', {
      GITHUB_APP_brunopenso_APP_ID: '4077218',
      GITHUB_APP_brunopenso_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\\nABC\\n-----END RSA PRIVATE KEY-----',
      GITHUB_APP_brunopenso_INSTALLATION_ID: '140892037',
    });

    expect(credentials.appId).toBe(4077218);
    expect(credentials.installationId).toBe(140892037);
    expect(credentials.privateKey).toContain('BEGIN RSA PRIVATE KEY');
    expect(credentials.privateKey).toContain('\n');
    expect(credentials.privateKey).not.toContain('\\n');
  });

  it('normalizes escaped newlines in private keys', () => {
    expect(normalizeGithubAppPrivateKey('line1\\nline2')).toBe('line1\nline2');
  });

  it('throws a clear error when credentials are missing', () => {
    expect(() => resolveGithubAppCredentials('acme', {})).toThrow(GithubAppCredentialsError);
    expect(() => resolveGithubAppCredentials('acme', {})).toThrow(
      /GITHUB_APP_acme_APP_ID/,
    );
  });
});
