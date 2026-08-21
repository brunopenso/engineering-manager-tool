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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.js';
import RoleBadgeList from '../components/profile/RoleBadgeList.js';
import { LabeledField, LabeledValue } from '../components/ui/LabeledField.js';
import { useAppTheme } from '../theme/AppThemeProvider.js';
import type { ThemeMode } from '../theme/appTheme.js';
import {
  patchMyProfile,
  ProfileApiError,
  type ProfileSettingsUpdate,
} from '../services/profileApi.js';
import type { DateFormatPreference, LanguagePreference } from '../types/profilePreferences.js';
import i18n from '../i18n/index.js';
import { DEFAULT_APP_ROUTE } from '../routes/shellOptions.js';

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { accessToken, user, setSession } = useAuth();
  const { setMode } = useAppTheme();
  const [githubDraft, setGithubDraft] = useState('');
  const [themeDraft, setThemeDraft] = useState<ThemeMode>('light');
  const [languageDraft, setLanguageDraft] = useState<LanguagePreference>('en-US');
  const [dateFormatDraft, setDateFormatDraft] = useState<DateFormatPreference>('MDY');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setGithubDraft(user.githubLogin ?? '');
      setThemeDraft(user.themePreference);
      setLanguageDraft(user.languagePreference);
      setDateFormatDraft(user.dateFormatPreference);
    }
  }, [user]);

  if (!user || !accessToken) {
    return null;
  }

  const profileUser = user;
  const sessionToken = accessToken;

  function handleThemeChange(_event: React.MouseEvent<HTMLElement>, nextMode: ThemeMode | null) {
    if (!nextMode) {
      return;
    }
    setThemeDraft(nextMode);
    setSaveError(null);
    setSaveSuccess(null);
  }

  function handleLanguageChange(
    _event: React.MouseEvent<HTMLElement>,
    nextLanguage: LanguagePreference | null,
  ) {
    if (!nextLanguage) {
      return;
    }
    setLanguageDraft(nextLanguage);
    setSaveError(null);
    setSaveSuccess(null);
  }

  function handleDateFormatChange(
    _event: React.MouseEvent<HTMLElement>,
    nextFormat: DateFormatPreference | null,
  ) {
    if (!nextFormat) {
      return;
    }
    setDateFormatDraft(nextFormat);
    setSaveError(null);
    setSaveSuccess(null);
  }

  const hasUnsavedChanges =
    githubDraft !== (profileUser.githubLogin ?? '') ||
    themeDraft !== profileUser.themePreference ||
    languageDraft !== profileUser.languagePreference ||
    dateFormatDraft !== profileUser.dateFormatPreference;

  async function handleSaveProfile() {
    if (!hasUnsavedChanges) {
      return;
    }

    const updates: ProfileSettingsUpdate = {};

    if (githubDraft !== (profileUser.githubLogin ?? '')) {
      updates.githubLogin = githubDraft;
    }
    if (themeDraft !== profileUser.themePreference) {
      updates.themePreference = themeDraft;
    }
    if (languageDraft !== profileUser.languagePreference) {
      updates.languagePreference = languageDraft;
    }
    if (dateFormatDraft !== profileUser.dateFormatPreference) {
      updates.dateFormatPreference = dateFormatDraft;
    }

    setSaveError(null);
    setSaveSuccess(null);
    setIsSavingProfile(true);
    try {
      const updatedUser = await patchMyProfile(sessionToken, updates);
      setSession({ accessToken: sessionToken, user: updatedUser });
      setMode(updatedUser.themePreference);
      await i18n.changeLanguage(updatedUser.languagePreference);
      setSaveSuccess(t('messages.saveSuccess'));
    } catch (error) {
      const message = error instanceof ProfileApiError ? error.message : t('errors.profileSave');
      setSaveError(message);
    } finally {
      setIsSavingProfile(false);
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
            <LabeledValue label={tCommon('fields.name')} value={profileUser.fullName} />
            <LabeledValue label={tCommon('fields.email')} value={profileUser.email} />
            <LabeledValue
              label={t('fields.leader')}
              value={profileUser.leader?.fullName ?? t('fields.leaderNone')}
            />
            <LabeledField label={t('fields.githubLogin')} htmlFor="profile-github-login">
              <TextField
                id="profile-github-login"
                hiddenLabel
                value={githubDraft}
                onChange={(event) => setGithubDraft(event.target.value)}
                placeholder={t('fields.githubPlaceholder')}
                helperText={t('fields.githubHelper')}
                fullWidth
              />
            </LabeledField>
            <LabeledField label={t('fields.activeRoles')}>
              <RoleBadgeList roles={profileUser.roles} />
            </LabeledField>
            <LabeledField label={t('fields.language')}>
              <ToggleButtonGroup
                exclusive
                value={languageDraft}
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
            </LabeledField>
            <LabeledField label={t('fields.dateFormat')}>
              <ToggleButtonGroup
                exclusive
                value={dateFormatDraft}
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
            </LabeledField>
            <LabeledField label={t('fields.appearance')}>
              <ToggleButtonGroup
                exclusive
                value={themeDraft}
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
            </LabeledField>
            {saveError ? <Alert severity="error">{saveError}</Alert> : null}
            {saveSuccess ? <Alert severity="success">{saveSuccess}</Alert> : null}
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => navigate(DEFAULT_APP_ROUTE)}>
                {tCommon('actions.cancel')}
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleSaveProfile()}
                disabled={!hasUnsavedChanges || isSavingProfile}
              >
                {isSavingProfile ? t('actions.saving') : tCommon('actions.save')}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
