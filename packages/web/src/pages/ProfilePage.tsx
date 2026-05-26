import {
  Container,
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '../auth/AuthProvider.js';
import RoleBadgeList from '../components/profile/RoleBadgeList.js';
import { useAppTheme } from '../theme/AppThemeProvider.js';
import type { ThemeMode } from '../theme/appTheme.js';

export default function ProfilePage() {
  const { user } = useAuth();
  const { mode, setMode } = useAppTheme();

  if (!user) {
    return null;
  }

  function handleThemeChange(
    _event: React.MouseEvent<HTMLElement>,
    nextMode: ThemeMode | null,
  ) {
    if (nextMode) {
      setMode(nextMode);
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              Your profile
            </Typography>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1">{user.fullName}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{user.email}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Active roles
              </Typography>
              <RoleBadgeList roles={user.roles} />
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Appearance
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={mode}
                onChange={handleThemeChange}
                aria-label="Theme appearance"
              >
                <ToggleButton value="light" aria-label="Light theme">
                  <LightModeIcon sx={{ mr: 1 }} fontSize="small" />
                  Light
                </ToggleButton>
                <ToggleButton value="dark" aria-label="Dark theme">
                  <DarkModeIcon sx={{ mr: 1 }} fontSize="small" />
                  Dark
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
