import { Alert, Box, Button, Paper, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TeamMemberHierarchyPicker from '../team-deliverables/TeamMemberHierarchyPicker.js';
import type { HierarchyViewNode } from '../../services/usersApi.js';

export type TeamPrPerformanceFiltersProps = {
  reports: HierarchyViewNode[];
  selectedUserId: string;
  startDate: string;
  endDate: string;
  disabled?: boolean;
  dateRangeError: string | null;
  onSelectedUserIdChange: (userId: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export default function TeamPrPerformanceFilters({
  reports,
  selectedUserId,
  startDate,
  endDate,
  disabled = false,
  dateRangeError,
  onSelectedUserIdChange,
  onStartDateChange,
  onEndDateChange,
}: TeamPrPerformanceFiltersProps) {
  const { t } = useTranslation(['leader', 'common']);

  return (
    <Paper variant="outlined" sx={{ p: 3 }} data-testid="team-pr-performance-filters">
      <Stack spacing={2}>
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
            reports={reports}
            selectedUserId={selectedUserId}
            disabled={disabled}
            onChange={onSelectedUserIdChange}
          />

          <TextField
            label={t('fields.startDate', { ns: 'common' })}
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            disabled={disabled}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { 'data-testid': 'pr-performance-start-date-input' },
            }}
          />

          <TextField
            label={t('fields.endDate', { ns: 'common' })}
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            disabled={disabled}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { 'data-testid': 'pr-performance-end-date-input' },
            }}
          />
        </Box>

        {selectedUserId ? (
          <Box>
            <Button
              size="small"
              onClick={() => onSelectedUserIdChange('')}
              disabled={disabled}
              data-testid="pr-performance-clear-member"
            >
              {t('teamPrPerformance.clearTeamMember')}
            </Button>
          </Box>
        ) : null}

        {dateRangeError ? (
          <Alert severity="warning" data-testid="pr-performance-date-range-error">
            {dateRangeError}
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}
