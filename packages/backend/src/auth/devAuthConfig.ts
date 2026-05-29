export function isDevAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_ENABLED === 'true';
}

export function getDevAuthSecret(): string | undefined {
  return process.env.DEV_AUTH_SECRET;
}

export function getDevAuthPublicRoutes(): string[] {
  if (!isDevAuthEnabled()) {
    return [];
  }

  return ['/auth/dev/users', '/auth/dev/login'];
}
