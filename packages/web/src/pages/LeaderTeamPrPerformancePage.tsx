import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DeveloperPrComparisonChart from '../components/leader-pr-performance/DeveloperPrComparisonChart.js';
import DeveloperPrDrilldownModal from '../components/leader-pr-performance/DeveloperPrDrilldownModal.js';
import DeveloperPrPerformanceTable from '../components/leader-pr-performance/DeveloperPrPerformanceTable.js';
import TeamPrPerformanceFilters from '../components/leader-pr-performance/TeamPrPerformanceFilters.js';
import TeamPrPerformanceSummaryCards from '../components/leader-pr-performance/TeamPrPerformanceSummaryCards.js';
import WeeklyAuthoredByClassificationChart from '../components/leader-pr-performance/WeeklyAuthoredByClassificationChart.js';
import { useAuth } from '../auth/AuthProvider.js';
import { isLeader } from '../auth/roleGuards.js';
import {
  defaultLast60DayRange,
  fetchTeamPrPerformance,
  isValidDateRange,
  LeaderPrPerformanceApiError,
  type DeveloperPrPerformanceRow,
  type TeamPrPerformanceResponse,
} from '../services/leaderPrPerformanceApi.js';
import {
  fetchLeaderHierarchyView,
  type LeaderHierarchyViewResponse,
  UsersApiError,
} from '../services/usersApi.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../types/profilePreferences.js';

export default function LeaderTeamPrPerformancePage() {
  const { accessToken, user } = useAuth();
  const { t } = useTranslation(['leader', 'common']);
  const dateFormatPreference = user?.dateFormatPreference ?? DEFAULT_DATE_FORMAT_PREFERENCE;
  const languagePreference = user?.languagePreference ?? DEFAULT_LANGUAGE_PREFERENCE;
  const defaultRange = useMemo(() => defaultLast60DayRange(), []);
  const [hierarchy, setHierarchy] = useState<LeaderHierarchyViewResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedScope, setSelectedScope] = useState<'subtree' | 'itself'>('subtree');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [performance, setPerformance] = useState<TeamPrPerformanceResponse | null>(null);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(true);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [drilldownDeveloper, setDrilldownDeveloper] = useState<DeveloperPrPerformanceRow | null>(
    null,
  );
  const fetchRequestId = useRef(0);

  const dateRangeIsValid = isValidDateRange(startDate, endDate);
  const hasTeamMembers = Boolean(hierarchy?.reports?.length);

  useEffect(() => {
    if (!accessToken || !isLeader(user)) {
      setIsLoadingHierarchy(false);
      return;
    }

    let cancelled = false;

    async function loadHierarchy() {
      setIsLoadingHierarchy(true);
      setErrorMessage(null);

      try {
        const data = await fetchLeaderHierarchyView(accessToken!);
        if (!cancelled) {
          setHierarchy(data);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof UsersApiError
              ? error.message
              : t('teamPrPerformance.hierarchyLoadError'),
          );
          setHierarchy(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHierarchy(false);
        }
      }
    }

    void loadHierarchy();

    return () => {
      cancelled = true;
    };
  }, [accessToken, t, user]);

  const loadPerformance = useCallback(async () => {
    if (!accessToken || !dateRangeIsValid) {
      return;
    }

    const requestId = ++fetchRequestId.current;
    setIsLoadingPerformance(true);
    setErrorMessage(null);

    try {
      const data = await fetchTeamPrPerformance(accessToken, {
        startDate,
        endDate,
        ...(selectedUserId ? { userId: selectedUserId, scope: selectedScope } : {}),
      });
      if (fetchRequestId.current === requestId) {
        setPerformance(data);
      }
    } catch (error) {
      if (fetchRequestId.current === requestId) {
        setErrorMessage(
          error instanceof LeaderPrPerformanceApiError
            ? error.message
            : t('teamPrPerformance.performanceLoadError'),
        );
        setPerformance(null);
      }
    } finally {
      if (fetchRequestId.current === requestId) {
        setIsLoadingPerformance(false);
      }
    }
  }, [accessToken, dateRangeIsValid, endDate, selectedUserId, selectedScope, startDate, t]);

  useEffect(() => {
    if (!accessToken || !isLeader(user) || isLoadingHierarchy) {
      return;
    }

    if (!dateRangeIsValid) {
      setDateRangeError(t('validation.endDateBeforeStart', { ns: 'common' }));
      setPerformance(null);
      return;
    }

    setDateRangeError(null);
    void loadPerformance();
  }, [accessToken, dateRangeIsValid, isLoadingHierarchy, loadPerformance, t, user]);

  if (!isLeader(user) || !accessToken) {
    return null;
  }

  const showEmptyFiltered =
    !isLoadingHierarchy &&
    !isLoadingPerformance &&
    hasTeamMembers &&
    dateRangeIsValid &&
    performance !== null &&
    performance.totals.authoredPullRequestCount === 0 &&
    performance.totals.commentCount === 0 &&
    performance.totals.reviewCount === 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4" gutterBottom>
            {t('teamPrPerformance.title')}
          </Typography>
          <Typography color="text.secondary">{t('teamPrPerformance.subtitle')}</Typography>
        </Box>

        <TeamPrPerformanceFilters
          reports={hierarchy?.reports ?? []}
          selectedUserId={selectedUserId}
          selectedScope={selectedScope}
          startDate={startDate}
          endDate={endDate}
          disabled={isLoadingHierarchy}
          dateRangeError={dateRangeError}
          onSelectionChange={(selection) => {
            if (!selection) {
              setSelectedUserId('');
              setSelectedScope('subtree');
              return;
            }
            setSelectedUserId(selection.userId);
            setSelectedScope(selection.scope);
          }}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!isLoadingHierarchy && !hasTeamMembers ? (
          <Alert severity="info">{t('teamPrPerformance.noTeamMembers')}</Alert>
        ) : null}

        {showEmptyFiltered ? (
          <Alert severity="info" data-testid="pr-performance-empty-filtered">
            {t('teamPrPerformance.emptyFiltered')}
          </Alert>
        ) : null}

        {isLoadingPerformance ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress aria-label={t('teamPrPerformance.loadingPerformance')} />
          </Box>
        ) : null}

        {!isLoadingHierarchy &&
        !isLoadingPerformance &&
        hasTeamMembers &&
        dateRangeIsValid &&
        performance ? (
          <Stack spacing={3} data-testid="team-pr-performance-loaded">
            <TeamPrPerformanceSummaryCards totals={performance.totals} />
            <WeeklyAuthoredByClassificationChart
              performance={performance}
              dateFormatPreference={dateFormatPreference}
              languagePreference={languagePreference}
            />
            <DeveloperPrComparisonChart developers={performance.developers} />
            <DeveloperPrPerformanceTable
              developers={performance.developers}
              onSelectDeveloper={setDrilldownDeveloper}
            />
          </Stack>
        ) : null}
      </Stack>

      <DeveloperPrDrilldownModal
        open={Boolean(drilldownDeveloper)}
        accessToken={accessToken}
        developer={drilldownDeveloper}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setDrilldownDeveloper(null)}
      />
    </Container>
  );
}
