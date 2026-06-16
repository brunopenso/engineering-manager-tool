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
import LanguageIcon from '@mui/icons-material/Language';
import EventIcon from '@mui/icons-material/Event';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.js';
import RoleBadgeList from '../components/profile/RoleBadgeList.js';
import { useAppTheme } from '../theme/AppThemeProvider.js';
import type { ThemeMode } from '../theme/appTheme.js';
import { patchMyProfile, ProfileApiError } from '../services/profileApi.js';
import type {
  DateFormatPreference,
  LanguagePreference,
} from '../types/profilePreferences.js';
import i18n from '../i18n/index.js';

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { accessToken, user, setSession } = useAuth();
  const { mode, setMode } = useAppTheme();
  const [githubDraft, setGithubDraft] = useState('');
  const [githubError, setGithubError] = useState<string | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [dateFormatError, setDateFormatError] = useState<string | null>(null);
  const [isSavingGithub, setIsSavingGithub] = useState(false);

  useEffect(() => {
    if (user) {
      setGithubDraft(user.githubLogin ?? '');
    }
  }, [user]);

  if (!user || !accessToken) {
    return null;
  }

  const profileUser = user;
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
          : t('errors.themeSave');
      setThemeError(message);
    }
  }

  async function handleLanguageChange(
    _event: React.MouseEvent<HTMLElement>,
    nextLanguage: LanguagePreference | null,
  ) {
    if (!nextLanguage || nextLanguage === profileUser.languagePreference) {
      return;
    }

    const previousLanguage = profileUser.languagePreference;
    setLanguageError(null);
    void i18n.changeLanguage(nextLanguage);

    try {
      const updatedUser = await patchMyProfile(sessionToken, {
        languagePreference: nextLanguage,
      });
      setSession({ accessToken: sessionToken, user: updatedUser });
    } catch (error) {
      void i18n.changeLanguage(previousLanguage);
      const message =
        error instanceof ProfileApiError
          ? error.message
          : t('errors.languageSave');
      setLanguageError(message);
    }
  }

  async function handleDateFormatChange(
    _event: React.MouseEvent<HTMLElement>,
    nextFormat: DateFormatPreference | null,
  ) {
    if (!nextFormat || nextFormat === profileUser.dateFormatPreference) {
      return;
    }

    setDateFormatError(null);

    try {
      const updatedUser = await patchMyProfile(sessionToken, {
        dateFormatPreference: nextFormat,
      });
      setSession({ accessToken: sessionToken, user: updatedUser });
    } catch (error) {
      const message =
        error instanceof ProfileApiError
          ? error.message
          : t('errors.dateFormatSave');
      setDateFormatError(message);
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
          : t('errors.githubSave');
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
              {t('title')}
            </Typography>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {tCommon('fields.name')}
              </Typography>
              <Typography variant="body1">{profileUser.fullName}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {tCommon('fields.email')}
              </Typography>
              <Typography variant="body1">{profileUser.email}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('fields.githubLogin')}
              </Typography>
              <TextField
                label={t('fields.githubLogin')}
                value={githubDraft}
                onChange={(event) => setGithubDraft(event.target.value)}
                placeholder={t('fields.githubPlaceholder')}
                helperText={t('fields.githubHelper')}
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
                  {isSavingGithub ? t('github.saving') : t('github.save')}
                </Button>
              </Box>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('fields.activeRoles')}
              </Typography>
              <RoleBadgeList roles={profileUser.roles} />
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('fields.language')}
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={profileUser.languagePreference}
                onChange={handleLanguageChange}
                aria-label={t('language.aria')}
              >
                <ToggleButton value="en-US" aria-label={t('language.enUS')}>
                  <LanguageIcon sx={{ mr: 1 }} fontSize="small" />
                  {t('language.enUS')}
                </ToggleButton>
                <ToggleButton value="pt-BR" aria-label={t('language.ptBR')}>
                  <LanguageIcon sx={{ mr: 1 }} fontSize="small" />
                  {t('language.ptBR')}
                </ToggleButton>
              </ToggleButtonGroup>
              {languageError ? <Alert severity="error">{languageError}</Alert> : null}
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('fields.dateFormat')}
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={profileUser.dateFormatPreference}
                onChange={handleDateFormatChange}
                aria-label={t('dateFormat.aria')}
              >
                <ToggleButton value="MDY" aria-label={t('dateFormat.mdy')}>
                  <EventIcon sx={{ mr: 1 }} fontSize="small" />
                  {t('dateFormat.mdy')}
                </ToggleButton>
                <ToggleButton value="DMY" aria-label={t('dateFormat.dmy')}>
                  <EventIcon sx={{ mr: 1 }} fontSize="small" />
                  {t('dateFormat.dmy')}
                </ToggleButton>
                <ToggleButton value="YMD" aria-label={t('dateFormat.ymd')}>
                  <EventIcon sx={{ mr: 1 }} fontSize="small" />
                  {t('dateFormat.ymd')}
                </ToggleButton>
              </ToggleButtonGroup>
              {dateFormatError ? <Alert severity="error">{dateFormatError}</Alert> : null}
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('fields.appearance')}
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={mode}
                onChange={handleThemeChange}
                aria-label={t('theme.aria')}
              >
                <ToggleButton value="light" aria-label={t('theme.lightAria')}>
                  <LightModeIcon sx={{ mr: 1 }} fontSize="small" />
                  {t('theme.light')}
                </ToggleButton>
                <ToggleButton value="dark" aria-label={t('theme.darkAria')}>
                  <DarkModeIcon sx={{ mr: 1 }} fontSize="small" />
                  {t('theme.dark')}
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
