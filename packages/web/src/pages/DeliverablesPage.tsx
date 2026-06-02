import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
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
  type SelectChangeEvent,
} from '@mui/material';
import { useAuth } from '../auth/AuthProvider.js';
import {
  deleteDeliverable,
  DeliverablesApiError,
  listMyDeliverables,
  type BusinessImpact,
  type DeliverableListFilters,
  type DeliverableSummary,
} from '../services/deliverablesApi.js';
import { fetchTagCatalog, type Tag } from '../services/tagsApi.js';
import { defaultLast30DayRange, isValidDateRange } from '../utils/dateRange.js';

const IMPACT_OPTIONS: { value: BusinessImpact; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'TRANSFORMATIONAL', label: 'Transformational' },
];

function filtersMatchDefault(
  startDate: string,
  endDate: string,
  selectedImpacts: BusinessImpact[],
  selectedTagIds: string[],
  defaultRange: { startDate: string; endDate: string },
): boolean {
  return (
    startDate === defaultRange.startDate &&
    endDate === defaultRange.endDate &&
    selectedImpacts.length === 0 &&
    selectedTagIds.length === 0
  );
}

export default function DeliverablesPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const defaultRange = useMemo(() => defaultLast30DayRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [selectedImpacts, setSelectedImpacts] = useState<BusinessImpact[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [catalogTags, setCatalogTags] = useState<Tag[]>([]);
  const [deliverables, setDeliverables] = useState<DeliverableSummary[]>([]);
  const [hasAnyDeliverables, setHasAnyDeliverables] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeliverableSummary | null>(null);
  const listRequestId = useRef(0);

  const dateRangeIsValid = isValidDateRange(startDate, endDate);
  const hasDeliverables = deliverables.length > 0;
  const isDefaultFilters = filtersMatchDefault(
    startDate,
    endDate,
    selectedImpacts,
    selectedTagIds,
    defaultRange,
  );
  const showClearFilters = !isDefaultFilters;

  const listFilters = useMemo<DeliverableListFilters | null>(() => {
    if (!dateRangeIsValid) {
      return null;
    }

    return {
      startDate,
      endDate,
      businessImpacts: selectedImpacts.length > 0 ? selectedImpacts : undefined,
      systemTagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    };
  }, [startDate, endDate, selectedImpacts, selectedTagIds, dateRangeIsValid]);

  const loadDeliverables = useCallback(async () => {
    if (!accessToken || !listFilters) {
      return;
    }

    const requestId = ++listRequestId.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await listMyDeliverables(accessToken, listFilters);
      if (requestId !== listRequestId.current) {
        return;
      }

      setDeliverables(result.deliverables ?? []);
      setHasAnyDeliverables(result.hasAnyDeliverables);
    } catch (error) {
      if (requestId !== listRequestId.current) {
        return;
      }

      setDeliverables([]);
      setHasAnyDeliverables(false);
      setErrorMessage(
        error instanceof DeliverablesApiError ? error.message : 'Unable to load deliverables.',
      );
    } finally {
      if (requestId === listRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [accessToken, listFilters]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;
    let cancelled = false;

    async function loadCatalog() {
      try {
        const tags = await fetchTagCatalog(token);
        if (!cancelled) {
          setCatalogTags(tags);
        }
      } catch {
        if (!cancelled) {
          setCatalogTags([]);
        }
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!dateRangeIsValid) {
      setDateRangeError('End date must be on or after start date.');
      setDeliverables([]);
      setIsLoading(false);
      return;
    }

    setDateRangeError(null);
    void loadDeliverables();
  }, [dateRangeIsValid, loadDeliverables]);

  function handleClearFilters() {
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
    setSelectedImpacts([]);
    setSelectedTagIds([]);
  }

  function handleImpactChange(event: SelectChangeEvent<BusinessImpact[]>) {
    const value = event.target.value;
    setSelectedImpacts(typeof value === 'string' ? (value.split(',') as BusinessImpact[]) : value);
  }

  function handleTagChange(event: SelectChangeEvent<string[]>) {
    const value = event.target.value;
    setSelectedTagIds(typeof value === 'string' ? value.split(',') : value);
  }

  async function handleDelete() {
    if (!accessToken || !deleteTarget) {
      return;
    }

    setErrorMessage(null);

    try {
      await deleteDeliverable(accessToken, deleteTarget.id);
      setDeleteTarget(null);
      await loadDeliverables();
    } catch (error) {
      setErrorMessage(
        error instanceof DeliverablesApiError ? error.message : 'Unable to delete deliverable.',
      );
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Deliverables
          </Typography>
          <Typography color="text.secondary">
            Capture your work outcomes, impact, and growth areas for performance conversations.
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
                md: 'repeat(2, minmax(160px, auto)) repeat(2, minmax(200px, 1fr)) auto',
              },
            }}
          >
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

            <FormControl>
              <InputLabel id="impact-filter-label" shrink>
                Impact
              </InputLabel>
              <Select
                labelId="impact-filter-label"
                multiple
                value={selectedImpacts}
                onChange={handleImpactChange}
                input={<OutlinedInput label="Impact" />}
                renderValue={(selected) =>
                  selected
                    .map((value) => IMPACT_OPTIONS.find((opt) => opt.value === value)?.label ?? value)
                    .join(', ')
                }
                data-testid="impact-filter-select"
              >
                {IMPACT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel id="tag-filter-label" shrink>
                System tags
              </InputLabel>
              <Select
                labelId="tag-filter-label"
                multiple
                value={selectedTagIds}
                onChange={handleTagChange}
                input={<OutlinedInput label="System tags" />}
                renderValue={(selected) => (
                  <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {selected.map((tagId) => {
                      const tag = catalogTags.find((item) => item.id === tagId);
                      return (
                        <Chip
                          key={tagId}
                          size="small"
                          label={tag?.name ?? tagId}
                          sx={{ bgcolor: tag?.color ?? 'grey.500', color: '#fff' }}
                        />
                      );
                    })}
                  </Stack>
                )}
                data-testid="tag-filter-select"
              >
                {catalogTags.map((tag) => (
                  <MenuItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {showClearFilters ? (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                data-testid="clear-filters-button"
                sx={{ alignSelf: 'center' }}
              >
                Clear all filters
              </Button>
            ) : null}
          </Box>

          {dateRangeError ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {dateRangeError}
            </Alert>
          ) : null}
        </Paper>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Box>
          <Button variant="contained" onClick={() => navigate('/app/deliverables/new')}>
            Add deliverable
          </Button>
        </Box>

        <Paper variant="outlined">
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              <Typography>Loading deliverables…</Typography>
            </Box>
          ) : !hasDeliverables ? (
            <Box sx={{ p: 3 }}>
              {!hasAnyDeliverables ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    No deliverables yet
                  </Typography>
                  <Typography color="text.secondary">
                    Add your first deliverable to start building your portfolio.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    No deliverables match your filters
                  </Typography>
                  <Typography color="text.secondary">
                    Try adjusting the date range, impact levels, or system tags.
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliverables.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.businessImpact}</TableCell>
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
                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          onClick={() => navigate(`/app/deliverables/${item.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button size="small" color="error" onClick={() => setDeleteTarget(item)}>
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Stack>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete deliverable?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove &quot;{deleteTarget?.title}&quot; from your portfolio.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
