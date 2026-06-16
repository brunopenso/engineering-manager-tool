import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AnalyticsWidgetGrid from '../components/leader-analytics/AnalyticsWidgetGrid.js';
import DeliverablesByImpactChart from '../components/leader-analytics/DeliverablesByImpactChart.js';
import EngagementByUserChart from '../components/leader-analytics/EngagementByUserChart.js';
import PendingReviewWidget from '../components/leader-analytics/PendingReviewWidget.js';
import TeamMemberHierarchyPicker from '../components/team-deliverables/TeamMemberHierarchyPicker.js';
import { useAuth } from '../auth/AuthProvider.js';
import { isLeader } from '../auth/roleGuards.js';
import {
  defaultLast60DayRange,
  fetchTeamAnalytics,
  isValidDateRange,
  LeaderAnalyticsApiError,
  type TeamAnalyticsResponse,
} from '../services/leaderAnalyticsApi.js';
import {
  fetchLeaderHierarchyView,
  type LeaderHierarchyViewResponse,
  UsersApiError,
} from '../services/usersApi.js';

export default function LeaderTeamAnalyticsPage() {
  const { accessToken, user } = useAuth();
  const defaultRange = useMemo(() => defaultLast60DayRange(), []);
  const [hierarchy, setHierarchy] = useState<LeaderHierarchyViewResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [analytics, setAnalytics] = useState<TeamAnalyticsResponse | null>(null);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const fetchRequestId = useRef(0);

  const dateRangeIsValid = isValidDateRange(startDate, endDate);

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
              : 'Unable to load team hierarchy.',
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
  }, [accessToken, user]);

  const loadAnalytics = useCallback(async () => {
    if (!accessToken || !dateRangeIsValid) {
      return;
    }

    const requestId = ++fetchRequestId.current;
    setIsLoadingAnalytics(true);
    setErrorMessage(null);

    try {
      const result = await fetchTeamAnalytics(accessToken, {
        startDate,
        endDate,
        ...(selectedUserId ? { userId: selectedUserId } : {}),
      });

      if (requestId === fetchRequestId.current) {
        setAnalytics(result);
      }
    } catch (error) {
      if (requestId === fetchRequestId.current) {
        setErrorMessage(
          error instanceof LeaderAnalyticsApiError
            ? error.message
            : 'Unable to load team analytics.',
        );
        setAnalytics(null);
      }
    } finally {
      if (requestId === fetchRequestId.current) {
        setIsLoadingAnalytics(false);
      }
    }
  }, [accessToken, startDate, endDate, selectedUserId, dateRangeIsValid]);

  useEffect(() => {
    if (!dateRangeIsValid) {
      setDateRangeError('End date must be on or after start date.');
      setAnalytics(null);
      return;
    }

    setDateRangeError(null);
    void loadAnalytics();
  }, [startDate, endDate, selectedUserId, dateRangeIsValid, loadAnalytics]);

  if (!isLeader(user)) {
    return null;
  }

  const hasReports = (hierarchy?.reports.length ?? 0) > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Team Analytics
          </Typography>
          <Typography color="text.secondary">
            Visualize deliverable activity and review workload across your reporting team.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              alignItems: 'start',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(220px, 1fr) repeat(2, minmax(160px, auto))',
              },
            }}
          >
            <TeamMemberHierarchyPicker
              reports={hierarchy?.reports ?? []}
              selectedUserId={selectedUserId}
              disabled={isLoadingHierarchy}
              onChange={setSelectedUserId}
            />

            <TextField
              label="Start date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { 'data-testid': 'analytics-start-date-input' },
              }}
            />

            <TextField
              label="End date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { 'data-testid': 'analytics-end-date-input' },
              }}
            />
          </Box>

          {dateRangeError ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {dateRangeError}
            </Alert>
          ) : null}
        </Paper>

        {errorMessage ? (
          <Alert severity="error">{errorMessage}</Alert>
        ) : null}

        {!isLoadingHierarchy && !hasReports ? (
          <Alert severity="info">
            No team members are available in your hierarchy. Analytics will appear when you have
            direct or indirect reports.
          </Alert>
        ) : null}

        {isLoadingAnalytics ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress aria-label="Loading analytics" />
          </Box>
        ) : (
          <AnalyticsWidgetGrid
            widgets={{
              pendingReview: (
                <PendingReviewWidget
                  totalCount={analytics?.pendingReviewCount ?? 0}
                  byImpact={analytics?.pendingReviewByImpact ?? []}
                />
              ),
              impact: <DeliverablesByImpactChart analytics={analytics} />,
              engagement: <EngagementByUserChart analytics={analytics} />,
            }}
          />
        )}
      </Stack>
    </Container>
  );
}
