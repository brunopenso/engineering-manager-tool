import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
import { getVisibleShellMenuSections, LOGIN_ROUTE } from '../../routes/shellOptions.js';
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobile);
  const {
    isConfirmingLogout,
    requestLogoutConfirmation,
    cancelLogoutConfirmation,
  } = useHeaderIdentityAction({
    pathname: location.pathname,
    isSessionActive: Boolean(accessToken && user?.email),
  });

  useEffect(() => {
    setIsDrawerOpen(!isMobile);
  }, [isMobile]);

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

  const menuSections = getVisibleShellMenuSections(user);

  const navigationContent = (
    <ShellNavigation
      sections={menuSections}
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
          <IconButton
            color="inherit"
            aria-label="open drawer"
            aria-expanded={isDrawerOpen}
            onClick={toggleDrawer}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
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
            fullName={user?.fullName ?? ''}
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
        <Drawer
          anchor="left"
          variant={isMobile ? 'temporary' : 'persistent'}
          open={isDrawerOpen}
          onClose={closeDrawer}
          sx={{
            width: isDrawerOpen && !isMobile ? DRAWER_WIDTH : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {navigationContent}
        </Drawer>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: isDrawerOpen && !isMobile ? `${DRAWER_WIDTH}px` : 0,
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
