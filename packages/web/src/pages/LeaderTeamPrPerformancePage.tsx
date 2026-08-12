import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TeamPrPerformanceFilters from '../components/leader-pr-performance/TeamPrPerformanceFilters.js';
import { useAuth } from '../auth/AuthProvider.js';
import { isLeader } from '../auth/roleGuards.js';
import {
  defaultLast60DayRange,
  fetchTeamPrPerformance,
  isValidDateRange,
  LeaderPrPerformanceApiError,
  type TeamPrPerformanceResponse,
} from '../services/leaderPrPerformanceApi.js';
import {
  fetchLeaderHierarchyView,
  type LeaderHierarchyViewResponse,
  UsersApiError,
} from '../services/usersApi.js';

export default function LeaderTeamPrPerformancePage() {
  const { accessToken, user } = useAuth();
  const { t } = useTranslation(['leader', 'common']);
  const defaultRange = useMemo(() => defaultLast60DayRange(), []);
  const [hierarchy, setHierarchy] = useState<LeaderHierarchyViewResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [performance, setPerformance] = useState<TeamPrPerformanceResponse | null>(null);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(true);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
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
        ...(selectedUserId ? { userId: selectedUserId } : {}),
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
  }, [accessToken, dateRangeIsValid, endDate, selectedUserId, startDate, t]);

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

  if (!isLeader(user)) {
    return null;
  }

  const showEmptyFiltered =
    !isLoadingHierarchy &&
    !isLoadingPerformance &&
    hasTeamMembers &&
    dateRangeIsValid &&
    performance !== null &&
    performance.developers.length === 0 &&
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
          startDate={startDate}
          endDate={endDate}
          disabled={isLoadingHierarchy}
          dateRangeError={dateRangeError}
          onSelectedUserIdChange={setSelectedUserId}
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
        performance &&
        !showEmptyFiltered ? (
          <Alert severity="success" data-testid="team-pr-performance-loaded">
            {t('teamPrPerformance.loadedSummary', {
              authored: performance.totals.authoredPullRequestCount,
              comments: performance.totals.commentCount,
              reviews: performance.totals.reviewCount,
              startDate: performance.startDate,
              endDate: performance.endDate,
            })}
          </Alert>
        ) : null}
      </Stack>
    </Container>
  );
}
