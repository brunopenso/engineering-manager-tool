import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.js';
import ActivitySummaryCards from '../components/my-pull-requests/ActivitySummaryCards.js';
import AuthoredPrsChart from '../components/my-pull-requests/AuthoredPrsChart.js';
import ChangeClassificationModal from '../components/my-pull-requests/ChangeClassificationModal.js';
import CreateDeliverableFromPrsModal from '../components/my-pull-requests/CreateDeliverableFromPrsModal.js';
import MyPullRequestsFilters from '../components/my-pull-requests/MyPullRequestsFilters.js';
import MyPullRequestsTable from '../components/my-pull-requests/MyPullRequestsTable.js';
import PullRequestDetailModal from '../components/my-pull-requests/PullRequestDetailModal.js';
import {
  defaultLast60DayRange,
  fetchMyPullRequestActivity,
  isValidDateRange,
  MyPullRequestsApiError,
  type MyActivityPullRequest,
  type PullRequestClassificationType,
} from '../services/myPullRequestsApi.js';
import {
  buildAuthoredWeeklySeries,
  countActorComments,
  countActorReviews,
  deriveRepositoryOptions,
  applyActivityFilters,
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
  const [classificationTypeFilter, setClassificationTypeFilter] = useState('');
  const [complexityIndexFilter, setComplexityIndexFilter] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState(defaultRange.startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(defaultRange.endDate);
  const [appliedRepositoryFilter, setAppliedRepositoryFilter] = useState('');
  const [appliedClassificationTypeFilter, setAppliedClassificationTypeFilter] = useState('');
  const [appliedComplexityIndexFilter, setAppliedComplexityIndexFilter] = useState('');
  const [pullRequests, setPullRequests] = useState<MyActivityPullRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [selectedPr, setSelectedPr] = useState<MyActivityPullRequest | null>(null);
  const [reclassifyOpen, setReclassifyOpen] = useState(false);
  const [createDeliverableOpen, setCreateDeliverableOpen] = useState(false);
  const [createDeliverableIds, setCreateDeliverableIds] = useState<string[]>([]);
  const fetchRequestId = useRef(0);
  const initialSearchDone = useRef(false);

  const runSearch = useCallback(
    async (params: {
      startDate: string;
      endDate: string;
      repositoryKey: string;
      classificationType: string;
      complexityIndex: string;
    }) => {
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
      setAppliedClassificationTypeFilter(params.classificationType);
      setAppliedComplexityIndexFilter(params.complexityIndex);

      const requestId = ++fetchRequestId.current;
      setIsLoading(true);
      setErrorMessage(null);
      setSelectedIds(new Set());

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
      classificationType: classificationTypeFilter,
      complexityIndex: complexityIndexFilter,
    });
  }, [
    runSearch,
    startDate,
    endDate,
    repositoryFilter,
    classificationTypeFilter,
    complexityIndexFilter,
  ]);

  useEffect(() => {
    if (!accessToken || !githubLogin || initialSearchDone.current) {
      return;
    }
    initialSearchDone.current = true;
    void runSearch({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      repositoryKey: '',
      classificationType: '',
      complexityIndex: '',
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

  const filtered = useMemo(() => {
    const complexityIndex =
      appliedComplexityIndexFilter === ''
        ? null
        : Number.parseInt(appliedComplexityIndexFilter, 10);
    return sortByMergedAtDesc(
      applyActivityFilters(pullRequests, {
        repositoryKey: appliedRepositoryFilter || null,
        classificationType: appliedClassificationTypeFilter || null,
        complexityIndex:
          complexityIndex !== null && Number.isFinite(complexityIndex) ? complexityIndex : null,
      }),
    );
  }, [
    pullRequests,
    appliedRepositoryFilter,
    appliedClassificationTypeFilter,
    appliedComplexityIndexFilter,
  ]);

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

  const handleToggleRow = useCallback((prId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(prId)) {
        next.delete(prId);
      } else {
        next.add(prId);
      }
      return next;
    });
  }, []);

  const handleTogglePage = useCallback((prIds: string[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of prIds) {
        if (selected) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  const handleReclassifySaved = useCallback(
    (updates: Array<{ id: string; userReclassification: PullRequestClassificationType }>) => {
      const byId = new Map(updates.map((item) => [item.id, item.userReclassification]));
      setPullRequests((prev) =>
        prev.map((pr) => {
          const nextClassification = byId.get(pr.id);
          if (!nextClassification) {
            return pr;
          }
          return { ...pr, userReclassification: nextClassification };
        }),
      );
      setSelectedIds(new Set());
    },
    [],
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
                classificationType={classificationTypeFilter}
                complexityIndex={complexityIndexFilter}
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
                onClassificationTypeChange={setClassificationTypeFilter}
                onComplexityIndexChange={setComplexityIndexFilter}
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

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ alignItems: 'flex-start' }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={selectedIds.size === 0}
                    onClick={() => {
                      setCreateDeliverableIds([...selectedIds]);
                      setCreateDeliverableOpen(true);
                    }}
                    data-testid="create-deliverable-button"
                    title={
                      selectedIds.size === 0 ? t('createDeliverable.emptySelectionHint') : undefined
                    }
                  >
                    {t('createDeliverable.button')}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={selectedIds.size === 0}
                    onClick={() => setReclassifyOpen(true)}
                    data-testid="change-classification-button"
                    title={selectedIds.size === 0 ? t('reclassify.emptySelectionHint') : undefined}
                  >
                    {t('reclassify.button')}
                  </Button>
                </Stack>

                <MyPullRequestsTable
                  pullRequests={filtered}
                  selectedIds={selectedIds}
                  dateFormatPreference={dateFormatPreference}
                  languagePreference={languagePreference}
                  onSelect={setSelectedPr}
                  onToggleRow={handleToggleRow}
                  onTogglePage={handleTogglePage}
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

      {accessToken ? (
        <ChangeClassificationModal
          open={reclassifyOpen}
          accessToken={accessToken}
          selectedCount={selectedIds.size}
          pullRequestIds={[...selectedIds]}
          onClose={() => setReclassifyOpen(false)}
          onSaved={handleReclassifySaved}
        />
      ) : null}

      {accessToken ? (
        <CreateDeliverableFromPrsModal
          open={createDeliverableOpen}
          accessToken={accessToken}
          pullRequestIds={createDeliverableIds}
          onClose={() => setCreateDeliverableOpen(false)}
          onCreated={() => setSelectedIds(new Set())}
        />
      ) : null}
    </Container>
  );
}
