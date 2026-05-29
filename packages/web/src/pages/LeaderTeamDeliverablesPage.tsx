import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Checkbox,
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
import { useAuth } from '../auth/AuthProvider.js';
import { isLeader } from '../auth/roleGuards.js';
import {
  defaultLast30DayRange,
  fetchTeamMembers,
  isValidDateRange,
  searchTeamDeliverables,
  setDeliverableReviewed,
  type TeamDeliverableRow,
  type TeamMemberOption,
  TeamDeliverablesApiError,
} from '../services/teamDeliverablesApi.js';

export default function LeaderTeamDeliverablesPage() {
  const { accessToken, user } = useAuth();
  const defaultRange = useMemo(() => defaultLast30DayRange(), []);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [deliverables, setDeliverables] = useState<TeamDeliverableRow[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const searchRequestId = useRef(0);

  const dateRangeIsValid = isValidDateRange(startDate, endDate);

  useEffect(() => {
    if (!accessToken || !isLeader(user)) {
      setIsLoadingMembers(false);
      return;
    }

    let cancelled = false;

    async function loadMembers() {
      setIsLoadingMembers(true);
      setErrorMessage(null);

      try {
        const members = await fetchTeamMembers(accessToken!);
        if (!cancelled) {
          setTeamMembers(members);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof TeamDeliverablesApiError
              ? error.message
              : 'Unable to load team members.',
          );
          setTeamMembers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMembers(false);
        }
      }
    }

    void loadMembers();

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

  async function handleReviewedToggle(deliverableId: string, nextReviewed: boolean) {
    if (!accessToken) {
      return;
    }

    const previous = deliverables;
    setDeliverables((current) =>
      current.map((row) =>
        row.id === deliverableId ? { ...row, reviewed: nextReviewed } : row,
      ),
    );

    try {
      await setDeliverableReviewed(accessToken, deliverableId, nextReviewed);
    } catch (error) {
      setDeliverables(previous);
      setErrorMessage(
        error instanceof TeamDeliverablesApiError
          ? error.message
          : 'Unable to update reviewed status.',
      );
    }
  }

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
            <FormControl sx={{ minWidth: 240 }} disabled={isLoadingMembers}>
              <InputLabel id="team-member-select-label">Team member</InputLabel>
              <Select
                labelId="team-member-select-label"
                label="Team member"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                data-testid="team-member-select"
              >
                <MenuItem value="">
                  <em>Select a team member</em>
                </MenuItem>
                {teamMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
        ) : teamMembers.length === 0 ? (
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
            ) : deliverables.length === 0 ? (
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
                    <TableCell align="center">Reviewed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliverables.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.title}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', maxWidth: 480 }}>
                        {item.description}
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={item.reviewed}
                          onChange={(event) =>
                            void handleReviewedToggle(item.id, event.target.checked)
                          }
                          slotProps={{
                            input: {
                              'aria-label': `Mark ${item.title} as reviewed`,
                            },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        ) : null}
      </Stack>
    </Container>
  );
}
