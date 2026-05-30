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
              : 'Unable to load team hierarchy.',
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
            : 'Unable to search team deliverables.',
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
      setDateRangeError('End date must be on or after start date.');
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
            Team Deliverables
          </Typography>
          <Typography color="text.secondary">
            Review your team&apos;s deliverables for coaching and performance conversations.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            useFlexGap
            sx={{ flexWrap: 'wrap' }}
          >
            <TeamMemberHierarchyPicker
              reports={hierarchy?.reports ?? []}
              selectedUserId={selectedUserId}
              disabled={isLoadingMembers}
              onChange={setSelectedUserId}
            />

            <TextField
              label="Start date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { 'data-testid': 'start-date-input' },
              }}
            />

            <TextField
              label="End date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { 'data-testid': 'end-date-input' },
              }}
            />

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="reviewed-filter-label">Review status</InputLabel>
              <Select
                labelId="reviewed-filter-label"
                label="Review status"
                value={reviewedFilter}
                onChange={(event) => setReviewedFilter(event.target.value as ReviewedFilter)}
                data-testid="reviewed-filter"
              >
                <MenuItem value="not_reviewed">Not reviewed</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {dateRangeError ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {dateRangeError}
            </Alert>
          ) : null}
        </Paper>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {isLoadingMembers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress aria-label="Loading team members" />
          </Box>
        ) : (hierarchy?.reports.length ?? 0) === 0 ? (
          <Alert severity="info">You have no team members available to review.</Alert>
        ) : null}

        {!selectedUserId ? (
          <Alert severity="info">Select a team member to search deliverables.</Alert>
        ) : null}

        {selectedUserId && dateRangeIsValid ? (
          <Paper variant="outlined">
            {isSearching ? (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress aria-label="Searching deliverables" size={28} />
              </Box>
            ) : filteredDeliverables.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">
                  No deliverables match the current filters.
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>System tags</TableCell>
                    <TableCell align="right">Actions</TableCell>
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
                          aria-label={`Review ${item.title}`}
                        >
                          Review
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
        />
      </Stack>
    </Container>
  );
}
