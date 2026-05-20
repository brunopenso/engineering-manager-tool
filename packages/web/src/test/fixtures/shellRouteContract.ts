export const shellRouteContract = {
  publicLoginRoutes: ['/', '/login'],
  authenticatedDefaultRoute: '/app',
  forbiddenRoutes: ['/app/welcome'],
} as const;
