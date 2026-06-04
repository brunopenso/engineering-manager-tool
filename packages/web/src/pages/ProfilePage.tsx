import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '../auth/AuthProvider.js';
import RoleBadgeList from '../components/profile/RoleBadgeList.js';
import { useAppTheme } from '../theme/AppThemeProvider.js';
import type { ThemeMode } from '../theme/appTheme.js';
import { patchMyProfile, ProfileApiError } from '../services/profileApi.js';

export default function ProfilePage() {
  const { accessToken, user, setSession } = useAuth();
  const { mode, setMode } = useAppTheme();
  const [githubDraft, setGithubDraft] = useState('');
  const [githubError, setGithubError] = useState<string | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [isSavingGithub, setIsSavingGithub] = useState(false);

  useEffect(() => {
    if (user) {
      setGithubDraft(user.githubLogin ?? '');
    }
  }, [user]);

  if (!user || !accessToken) {
    return null;
  }

  const sessionToken = accessToken;

  async function handleThemeChange(
    _event: React.MouseEvent<HTMLElement>,
    nextMode: ThemeMode | null,
  ) {
    if (!nextMode || nextMode === mode) {
      return;
    }

    const previousMode = mode;
    setThemeError(null);
    setMode(nextMode);

    try {
      const updatedUser = await patchMyProfile(sessionToken, {
        themePreference: nextMode,
      });
      setSession({ accessToken: sessionToken, user: updatedUser });
    } catch (error) {
      setMode(previousMode);
      const message =
        error instanceof ProfileApiError
          ? error.message
          : 'Could not save appearance preference.';
      setThemeError(message);
    }
  }

  async function handleGithubSave() {
    setGithubError(null);
    setIsSavingGithub(true);

    try {
      const updatedUser = await patchMyProfile(sessionToken, {
        githubLogin: githubDraft,
      });
      setSession({ accessToken: sessionToken, user: updatedUser });
      setGithubDraft(updatedUser.githubLogin ?? '');
    } catch (error) {
      const message =
        error instanceof ProfileApiError
          ? error.message
          : 'Could not save GitHub login.';
      setGithubError(message);
    } finally {
      setIsSavingGithub(false);
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
                GitHub login
              </Typography>
              <TextField
                label="GitHub login"
                value={githubDraft}
                onChange={(event) => setGithubDraft(event.target.value)}
                placeholder="octocat"
                helperText="Your GitHub username (handle), not a full profile URL."
                error={Boolean(githubError)}
                fullWidth
              />
              {githubError ? <Alert severity="error">{githubError}</Alert> : null}
              <Box>
                <Button
                  variant="contained"
                  onClick={() => void handleGithubSave()}
                  disabled={isSavingGithub}
                >
                  {isSavingGithub ? 'Saving…' : 'Save GitHub login'}
                </Button>
              </Box>
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
              {themeError ? <Alert severity="error">{themeError}</Alert> : null}
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
