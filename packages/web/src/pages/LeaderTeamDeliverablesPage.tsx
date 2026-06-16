import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import TeamDeliverableReviewModal from '../components/team-deliverables/TeamDeliverableReviewModal.js';
import TeamMemberHierarchyPicker from '../components/team-deliverables/TeamMemberHierarchyPicker.js';
import { useAuth } from '../auth/AuthProvider.js';
import { isLeader } from '../auth/roleGuards.js';
import {
  defaultLast30DayRange,
  isValidDateRange,
  searchTeamDeliverables,
  type TeamDeliverableRow,
  TeamDeliverablesApiError,
} from '../services/teamDeliverablesApi.js';
import {
  fetchLeaderHierarchyView,
  type LeaderHierarchyViewResponse,
  UsersApiError,
} from '../services/usersApi.js';

type ReviewedFilter = 'not_reviewed' | 'reviewed' | 'all';

export default function LeaderTeamDeliverablesPage() {
  const { accessToken, user } = useAuth();
  const { t } = useTranslation(['leader', 'common']);
  const defaultRange = useMemo(() => defaultLast30DayRange(), []);
  const [hierarchy, setHierarchy] = useState<LeaderHierarchyViewResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [deliverables, setDeliverables] = useState<TeamDeliverableRow[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [reviewedFilter, setReviewedFilter] = useState<ReviewedFilter>('not_reviewed');
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);
  const searchRequestId = useRef(0);

  const dateRangeIsValid = isValidDateRange(startDate, endDate);

  const filteredDeliverables = useMemo(() => {
    if (reviewedFilter === 'reviewed') {
      return deliverables.filter((item) => item.reviewed);
    }

    if (reviewedFilter === 'not_reviewed') {
      return deliverables.filter((item) => !item.reviewed);
    }

    return deliverables;
  }, [deliverables, reviewedFilter]);

  useEffect(() => {
    if (!accessToken || !isLeader(user)) {
      setIsLoadingMembers(false);
      return;
    }

    let cancelled = false;

    async function loadHierarchy() {
      setIsLoadingMembers(true);
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
              : t('teamDeliverables.hierarchyLoadError'),
          );
          setHierarchy(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMembers(false);
        }
      }
    }

    void loadHierarchy();

    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  const runSearch = useCallback(async () => {
    if (!accessToken || !selectedUserId || !dateRangeIsValid) {
      return;
    }

    const requestId = ++searchRequestId.current;
    setIsSearching(true);
    setErrorMessage(null);

    try {
      const result = await searchTeamDeliverables(accessToken, {
        userId: selectedUserId,
        startDate,
        endDate,
      });

      if (requestId === searchRequestId.current) {
        setDeliverables(result.deliverables);
      }
    } catch (error) {
      if (requestId === searchRequestId.current) {
        setErrorMessage(
          error instanceof TeamDeliverablesApiError
            ? error.message
            : t('teamDeliverables.searchError'),
        );
        setDeliverables([]);
      }
    } finally {
      if (requestId === searchRequestId.current) {
        setIsSearching(false);
      }
    }
  }, [accessToken, selectedUserId, startDate, endDate, dateRangeIsValid]);

  useEffect(() => {
    if (!selectedUserId) {
      setDeliverables([]);
      return;
    }

    if (!dateRangeIsValid) {
      setDateRangeError(t('validation.endDateBeforeStart', { ns: 'common' }));
      setDeliverables([]);
      return;
    }

    setDateRangeError(null);
    void runSearch();
  }, [selectedUserId, startDate, endDate, dateRangeIsValid, runSearch]);

  if (!isLeader(user)) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('teamDeliverables.title')}
          </Typography>
          <Typography color="text.secondary">{t('teamDeliverables.subtitle')}</Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              alignItems: 'start',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(220px, 1fr) repeat(2, minmax(160px, auto)) minmax(180px, auto)',
              },
            }}
          >
            <TeamMemberHierarchyPicker
              reports={hierarchy?.reports ?? []}
              selectedUserId={selectedUserId}
              disabled={isLoadingMembers}
              onChange={setSelectedUserId}
            />

            <TextField
              label={t('fields.startDate', { ns: 'common' })}
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { 'data-testid': 'start-date-input' },
              }}
            />

            <TextField
              label={t('fields.endDate', { ns: 'common' })}
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { 'data-testid': 'end-date-input' },
              }}
            />

            <FormControl>
              <InputLabel id="reviewed-filter-label" shrink>
                {t('teamDeliverables.reviewStatus')}
              </InputLabel>
              <Select
                labelId="reviewed-filter-label"
                label={t('teamDeliverables.reviewStatus')}
                value={reviewedFilter}
                onChange={(event) => setReviewedFilter(event.target.value as ReviewedFilter)}
                data-testid="reviewed-filter"
              >
                <MenuItem value="not_reviewed">{t('teamDeliverables.notReviewed')}</MenuItem>
                <MenuItem value="reviewed">{t('teamDeliverables.reviewed')}</MenuItem>
                <MenuItem value="all">{t('actions.all', { ns: 'common' })}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {dateRangeError ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {dateRangeError}
            </Alert>
          ) : null}
        </Paper>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {isLoadingMembers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress aria-label={t('teamDeliverables.loadingMembers')} />
          </Box>
        ) : (hierarchy?.reports.length ?? 0) === 0 ? (
          <Alert severity="info">{t('teamDeliverables.noTeamMembers')}</Alert>
        ) : null}

        {!selectedUserId ? (
          <Alert severity="info">{t('teamDeliverables.selectMember')}</Alert>
        ) : null}

        {selectedUserId && dateRangeIsValid ? (
          <Paper variant="outlined">
            {isSearching ? (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress aria-label={t('teamDeliverables.searching')} size={28} />
              </Box>
            ) : filteredDeliverables.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">{t('teamDeliverables.noResults')}</Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('fields.title', { ns: 'common' })}</TableCell>
                    <TableCell>{t('teamDeliverables.description')}</TableCell>
                    <TableCell>{t('systemTags', { ns: 'common' })}</TableCell>
                    <TableCell align="right">{t('actions.actions', { ns: 'common' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDeliverables.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.title}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', maxWidth: 480 }}>
                        {item.description}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          {item.systemTags.map((tag) => (
                            <Chip
                              key={tag.id}
                              size="small"
                              label={tag.name}
                              sx={{ bgcolor: tag.color, color: '#fff' }}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSelectedDeliverableId(item.id)}
                          aria-label={t('teamDeliverables.reviewAria', { title: item.title })}
                        >
                          {t('teamDeliverables.review')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        ) : null}

        <TeamDeliverableReviewModal
          open={selectedDeliverableId !== null}
          deliverableId={selectedDeliverableId}
          accessToken={accessToken}
          onClose={() => setSelectedDeliverableId(null)}
          onReviewedChange={(deliverableId, reviewed) => {
            setDeliverables((current) =>
              current.map((item) =>
                item.id === deliverableId ? { ...item, reviewed } : item,
              ),
            );
          }}
        />
      </Stack>
    </Container>
  );
}
