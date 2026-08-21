import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider.js';
import HierarchyTree from '../hierarchy/HierarchyTree.js';
import { LabeledField, LabeledValue } from '../ui/LabeledField.js';
import {
  fetchLeaderHierarchyView,
  type LeaderHierarchyViewResponse,
  UsersApiError,
} from '../../services/usersApi.js';

export default function LeaderHierarchyViewPanel() {
  const { accessToken } = useAuth();
  const { t } = useTranslation('leader');
  const [hierarchy, setHierarchy] = useState<LeaderHierarchyViewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    const token = accessToken;
    let cancelled = false;

    async function loadHierarchy() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await fetchLeaderHierarchyView(token);
        if (!cancelled) {
          setHierarchy(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof UsersApiError ? error.message : t('hierarchy.viewLoadError');
          setErrorMessage(message);
          setHierarchy(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHierarchy();

    return () => {
      cancelled = true;
    };
  }, [accessToken, t]);

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        {t('hierarchy.viewSubtitle')}
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label={t('hierarchy.loadingHierarchy')} />
        </Box>
      )}

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      {!isLoading && hierarchy && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={3}>
            {hierarchy.manager && (
              <LabeledValue
                label={t('hierarchy.yourManager')}
                value={hierarchy.manager.displayName}
              />
            )}

            <LabeledField label={t('hierarchy.yourTeam')}>
              <HierarchyTree self={hierarchy.self} reports={hierarchy.reports} />
            </LabeledField>
          </Stack>
        </Paper>
      )}

      {!isLoading && hierarchy && hierarchy.reports.length === 0 && !hierarchy.manager && (
        <Alert severity="info">{t('hierarchy.emptyNoManagerOrReports')}</Alert>
      )}
    </Stack>
  );
}
