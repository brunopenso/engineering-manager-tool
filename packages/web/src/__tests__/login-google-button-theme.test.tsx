import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../pages/LoginPage.js';
import { renderWithProviders } from '../test/renderWithProviders.js';
import { THEME_COOKIE_NAME, setThemeCookie } from '../theme/themeCookie.js';
import type { ReactNode } from 'react';

const googleLoginMock = vi.hoisted(() => vi.fn());

vi.mock('@react-oauth/google', async () => {
  const React = await import('react');

  return {
    GoogleOAuthProvider: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    GoogleLogin: (props: { theme?: string }) => {
      googleLoginMock(props);

      return React.createElement(
        'button',
        {
          type: 'button',
          'data-testid': 'google-login',
          'data-theme': props.theme ?? '',
        },
        'Google login',
      );
    },
  };
});

describe('LoginPage Google button theme', () => {
  afterEach(() => {
    googleLoginMock.mockClear();
    document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0`;
  });

  it('keeps the default Google outline button in light mode', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByTestId('google-login')).toHaveAttribute('data-theme', 'outline');
    expect(googleLoginMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme: 'outline' }),
    );
  });

  it('uses the dark Google button in dark mode', () => {
    setThemeCookie('dark');

    renderWithProviders(<LoginPage />);

    expect(screen.getByTestId('google-login')).toHaveAttribute(
      'data-theme',
      'filled_black',
    );
    expect(googleLoginMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme: 'filled_black' }),
    );
  });
});
