import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../auth/AuthProvider.js';
import { SHELL_MENU_OPTIONS, LOGIN_ROUTE } from '../../routes/shellOptions.js';
import ShellNavigation from './ShellNavigation.js';
import HeaderIdentityAction from './HeaderIdentityAction.js';
import { useHeaderIdentityAction } from './useHeaderIdentityAction.js';

const DRAWER_WIDTH = 280;

export default function AppShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, clearSession, accessToken } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    isConfirmingLogout,
    requestLogoutConfirmation,
    cancelLogoutConfirmation,
  } = useHeaderIdentityAction({
    pathname: location.pathname,
    isSessionActive: Boolean(accessToken && user?.email),
  });

  function toggleDrawer() {
    setIsDrawerOpen((currentState) => !currentState);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  function handleConfirmLogout() {
    clearSession();
    navigate(LOGIN_ROUTE, { replace: true });
  }

  const navigationContent = (
    <ShellNavigation
      options={SHELL_MENU_OPTIONS}
      onOptionSelected={closeDrawer}
    />
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            Engineering Manager Tool
          </Typography>
          <HeaderIdentityAction
            email={user?.email ?? ''}
            isConfirmingLogout={isConfirmingLogout}
            onIdentityClick={requestLogoutConfirmation}
            onConfirmLogout={handleConfirmLogout}
            onCancelLogout={cancelLogoutConfirmation}
          />
        </Toolbar>
      </AppBar>

      {/* Main content area */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Desktop Navigation */}
        {!isMobile && (
          <Box
            component="nav"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
            }}
          >
            {navigationContent}
          </Box>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={isDrawerOpen}
            onClose={closeDrawer}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
              },
            }}
          >
            {navigationContent}
          </Drawer>
        )}

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
