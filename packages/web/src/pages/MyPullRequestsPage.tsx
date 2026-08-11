import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.js';
import ActivitySummaryCards from '../components/my-pull-requests/ActivitySummaryCards.js';
import AuthoredPrsChart from '../components/my-pull-requests/AuthoredPrsChart.js';
import MyPullRequestsFilters from '../components/my-pull-requests/MyPullRequestsFilters.js';
import MyPullRequestsTable from '../components/my-pull-requests/MyPullRequestsTable.js';
import PullRequestDetailModal from '../components/my-pull-requests/PullRequestDetailModal.js';
import {
  defaultLast60DayRange,
  fetchMyPullRequestActivity,
  isValidDateRange,
  MyPullRequestsApiError,
  type MyActivityPullRequest,
} from '../services/myPullRequestsApi.js';
import {
  buildAuthoredWeeklySeries,
  countActorComments,
  countActorReviews,
  deriveRepositoryOptions,
  filterByRepository,
  sortByMergedAtDesc,
} from '../utils/myPullRequestActivity.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../types/profilePreferences.js';

export default function MyPullRequestsPage() {
  const { accessToken, user } = useAuth();
  const { t } = useTranslation(['prActivity', 'common']);
  const dateFormatPreference = user?.dateFormatPreference ?? DEFAULT_DATE_FORMAT_PREFERENCE;
  const languagePreference = user?.languagePreference ?? DEFAULT_LANGUAGE_PREFERENCE;
  const githubLogin = user?.githubLogin?.trim() || null;

  const defaultRange = useMemo(() => defaultLast60DayRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [appliedStartDate, setAppliedStartDate] = useState(defaultRange.startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(defaultRange.endDate);
  const [repositoryFilter, setRepositoryFilter] = useState('');
  const [pullRequests, setPullRequests] = useState<MyActivityPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [selectedPr, setSelectedPr] = useState<MyActivityPullRequest | null>(null);
  const fetchRequestId = useRef(0);

  useEffect(() => {
    if (!isValidDateRange(startDate, endDate)) {
      setDateRangeError(t('validation.endDateBeforeStart', { ns: 'common' }));
      return;
    }
    setDateRangeError(null);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  }, [startDate, endDate, t]);

  useEffect(() => {
    if (!accessToken || !githubLogin) {
      setPullRequests([]);
      setIsLoading(false);
      return;
    }

    const requestId = ++fetchRequestId.current;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetchMyPullRequestActivity(accessToken!, {
          startDate: appliedStartDate,
          endDate: appliedEndDate,
        });
        if (!cancelled && requestId === fetchRequestId.current) {
          setPullRequests(response.pullRequests);
        }
      } catch (error) {
        if (!cancelled && requestId === fetchRequestId.current) {
          setErrorMessage(error instanceof MyPullRequestsApiError ? error.message : t('loadError'));
          setPullRequests([]);
        }
      } finally {
        if (!cancelled && requestId === fetchRequestId.current) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, githubLogin, appliedStartDate, appliedEndDate, t]);

  const repositoryOptions = useMemo(() => deriveRepositoryOptions(pullRequests), [pullRequests]);

  useEffect(() => {
    if (repositoryFilter && !repositoryOptions.some((option) => option.key === repositoryFilter)) {
      setRepositoryFilter('');
    }
  }, [repositoryFilter, repositoryOptions]);

  const filtered = useMemo(
    () => sortByMergedAtDesc(filterByRepository(pullRequests, repositoryFilter || null)),
    [pullRequests, repositoryFilter],
  );

  const chartSeries = useMemo(
    () =>
      buildAuthoredWeeklySeries(filtered, {
        startDate: appliedStartDate,
        endDate: appliedEndDate,
      }),
    [filtered, appliedStartDate, appliedEndDate],
  );

  const commentCount = useMemo(
    () => (githubLogin ? countActorComments(filtered, githubLogin) : 0),
    [filtered, githubLogin],
  );
  const reviewCount = useMemo(
    () => (githubLogin ? countActorReviews(filtered, githubLogin) : 0),
    [filtered, githubLogin],
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('title')}
          </Typography>
          <Typography color="text.secondary">{t('subtitle')}</Typography>
        </Box>

        {!githubLogin ? (
          <Alert severity="info" data-testid="pr-activity-no-github">
            <Typography variant="subtitle1">{t('noGithub.title')}</Typography>
            <Typography variant="body2">{t('noGithub.body')}</Typography>
          </Alert>
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <MyPullRequestsFilters
                startDate={startDate}
                endDate={endDate}
                repositoryKey={repositoryFilter}
                repositoryOptions={repositoryOptions}
                dateRangeError={dateRangeError}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onRepositoryChange={setRepositoryFilter}
              />
            </Paper>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress aria-label={t('loading')} />
              </Box>
            ) : (
              <>
                {filtered.length === 0 ? (
                  <Alert severity="info" data-testid="pr-activity-empty">
                    <Typography variant="subtitle1">{t('empty.title')}</Typography>
                    <Typography variant="body2">{t('empty.body')}</Typography>
                  </Alert>
                ) : null}

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  sx={{ alignItems: 'stretch' }}
                >
                  <Box sx={{ flex: 2, minWidth: 0 }}>
                    <AuthoredPrsChart series={chartSeries} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ActivitySummaryCards commentCount={commentCount} reviewCount={reviewCount} />
                  </Box>
                </Stack>

                <MyPullRequestsTable
                  pullRequests={filtered}
                  dateFormatPreference={dateFormatPreference}
                  languagePreference={languagePreference}
                  onSelect={setSelectedPr}
                />
              </>
            )}
          </>
        )}
      </Stack>

      <PullRequestDetailModal
        open={Boolean(selectedPr)}
        pullRequest={selectedPr}
        dateFormatPreference={dateFormatPreference}
        languagePreference={languagePreference}
        onClose={() => setSelectedPr(null)}
      />
    </Container>
  );
}
