import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider.js';
import { SHELL_MENU_OPTIONS, LOGIN_ROUTE } from '../../routes/shellOptions.js';
import ShellNavigation from './ShellNavigation.js';
import HeaderIdentityAction from './HeaderIdentityAction.js';
import { useHeaderIdentityAction } from './useHeaderIdentityAction.js';

export default function AppShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearSession, accessToken } = useAuth();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const {
    isConfirmingLogout,
    requestLogoutConfirmation,
    cancelLogoutConfirmation,
  } = useHeaderIdentityAction({
    pathname: location.pathname,
    isSessionActive: Boolean(accessToken && user?.email),
  });

  function toggleMenu() {
    setIsMenuExpanded((currentState) => !currentState);
  }

  function collapseMenu() {
    setIsMenuExpanded(false);
  }

  function handleConfirmLogout() {
    clearSession();
    navigate(LOGIN_ROUTE, { replace: true });
  }

  return (
    <div>
      <header>
        <strong>Engineering Manager Tool</strong>
        <HeaderIdentityAction
          email={user?.email ?? ''}
          isConfirmingLogout={isConfirmingLogout}
          onIdentityClick={requestLogoutConfirmation}
          onConfirmLogout={handleConfirmLogout}
          onCancelLogout={cancelLogoutConfirmation}
        />
      </header>
      <div>
        <ShellNavigation
          isExpanded={isMenuExpanded}
          options={SHELL_MENU_OPTIONS}
          onToggle={toggleMenu}
          onOptionSelected={collapseMenu}
        />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
