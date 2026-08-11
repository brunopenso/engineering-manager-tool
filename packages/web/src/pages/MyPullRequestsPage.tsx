import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [repositoryFilter, setRepositoryFilter] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState(defaultRange.startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(defaultRange.endDate);
  const [appliedRepositoryFilter, setAppliedRepositoryFilter] = useState('');
  const [pullRequests, setPullRequests] = useState<MyActivityPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [selectedPr, setSelectedPr] = useState<MyActivityPullRequest | null>(null);
  const fetchRequestId = useRef(0);
  const initialSearchDone = useRef(false);

  const runSearch = useCallback(
    async (params: { startDate: string; endDate: string; repositoryKey: string }) => {
      if (!accessToken || !githubLogin) {
        setPullRequests([]);
        setIsLoading(false);
        return;
      }

      if (!isValidDateRange(params.startDate, params.endDate)) {
        setDateRangeError(t('validation.endDateBeforeStart', { ns: 'common' }));
        return;
      }

      setDateRangeError(null);
      setAppliedStartDate(params.startDate);
      setAppliedEndDate(params.endDate);
      setAppliedRepositoryFilter(params.repositoryKey);

      const requestId = ++fetchRequestId.current;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchMyPullRequestActivity(accessToken, {
          startDate: params.startDate,
          endDate: params.endDate,
        });
        if (requestId === fetchRequestId.current) {
          setPullRequests(response.pullRequests);
        }
      } catch (error) {
        if (requestId === fetchRequestId.current) {
          setErrorMessage(error instanceof MyPullRequestsApiError ? error.message : t('loadError'));
          setPullRequests([]);
        }
      } finally {
        if (requestId === fetchRequestId.current) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, githubLogin, t],
  );

  const handleSearch = useCallback(() => {
    void runSearch({
      startDate,
      endDate,
      repositoryKey: repositoryFilter,
    });
  }, [runSearch, startDate, endDate, repositoryFilter]);

  useEffect(() => {
    if (!accessToken || !githubLogin || initialSearchDone.current) {
      return;
    }
    initialSearchDone.current = true;
    void runSearch({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      repositoryKey: '',
    });
  }, [accessToken, githubLogin, defaultRange, runSearch]);

  const repositoryOptions = useMemo(() => deriveRepositoryOptions(pullRequests), [pullRequests]);

  useEffect(() => {
    if (repositoryFilter && !repositoryOptions.some((option) => option.key === repositoryFilter)) {
      setRepositoryFilter('');
    }
  }, [repositoryFilter, repositoryOptions]);

  useEffect(() => {
    if (
      appliedRepositoryFilter &&
      !repositoryOptions.some((option) => option.key === appliedRepositoryFilter)
    ) {
      setAppliedRepositoryFilter('');
    }
  }, [appliedRepositoryFilter, repositoryOptions]);

  const filtered = useMemo(
    () => sortByMergedAtDesc(filterByRepository(pullRequests, appliedRepositoryFilter || null)),
    [pullRequests, appliedRepositoryFilter],
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
                isSearching={isLoading}
                onStartDateChange={(value) => {
                  setStartDate(value);
                  setDateRangeError(null);
                }}
                onEndDateChange={(value) => {
                  setEndDate(value);
                  setDateRangeError(null);
                }}
                onRepositoryChange={setRepositoryFilter}
                onSearch={handleSearch}
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
