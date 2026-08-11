import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { RepositoryOption } from '../../utils/myPullRequestActivity.js';

type MyPullRequestsFiltersProps = {
  startDate: string;
  endDate: string;
  repositoryKey: string;
  repositoryOptions: RepositoryOption[];
  dateRangeError: string | null;
  isSearching: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onRepositoryChange: (value: string) => void;
  onSearch: () => void;
};

export default function MyPullRequestsFilters({
  startDate,
  endDate,
  repositoryKey,
  repositoryOptions,
  dateRangeError,
  isSearching,
  onStartDateChange,
  onEndDateChange,
  onRepositoryChange,
  onSearch,
}: MyPullRequestsFiltersProps) {
  const { t } = useTranslation(['prActivity', 'common']);

  return (
    <Stack
      spacing={2}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <Typography variant="subtitle2" color="text.secondary">
        {t('filters.period')}
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: { sm: 'flex-start' } }}
      >
        <TextField
          label={t('fields.startDate', { ns: 'common' })}
          type="date"
          size="small"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { 'data-testid': 'pr-activity-start-date' },
          }}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label={t('fields.endDate', { ns: 'common' })}
          type="date"
          size="small"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { 'data-testid': 'pr-activity-end-date' },
          }}
          sx={{ minWidth: 180 }}
        />
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="pr-activity-repo-label">{t('filters.repository')}</InputLabel>
          <Select
            labelId="pr-activity-repo-label"
            label={t('filters.repository')}
            value={repositoryKey}
            onChange={(event) => onRepositoryChange(event.target.value)}
            data-testid="pr-activity-repository"
          >
            <MenuItem value="">
              <em>{t('filters.allRepositories')}</em>
            </MenuItem>
            {repositoryOptions.map((option) => (
              <MenuItem key={option.key} value={option.key}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          type="submit"
          variant="contained"
          disabled={isSearching}
          data-testid="pr-activity-search"
          sx={{ minWidth: 140, alignSelf: { xs: 'stretch', sm: 'center' } }}
        >
          {isSearching ? t('filters.searching') : t('filters.search')}
        </Button>
      </Stack>
      {dateRangeError ? (
        <Typography color="error" variant="body2" role="alert" data-testid="pr-activity-date-error">
          {dateRangeError}
        </Typography>
      ) : null}
    </Stack>
  );
}
