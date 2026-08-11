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

export const CLASSIFICATION_TYPE_OPTIONS = [
  'feature',
  'fix',
  'documentation',
  'maintenance',
] as const;
export const COMPLEXITY_INDEX_OPTIONS = [1, 2, 3, 4, 5] as const;

type MyPullRequestsFiltersProps = {
  startDate: string;
  endDate: string;
  repositoryKey: string;
  repositoryOptions: RepositoryOption[];
  classificationType: string;
  complexityIndex: string;
  dateRangeError: string | null;
  isSearching: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onRepositoryChange: (value: string) => void;
  onClassificationTypeChange: (value: string) => void;
  onComplexityIndexChange: (value: string) => void;
  onSearch: () => void;
};

export default function MyPullRequestsFilters({
  startDate,
  endDate,
  repositoryKey,
  repositoryOptions,
  classificationType,
  complexityIndex,
  dateRangeError,
  isSearching,
  onStartDateChange,
  onEndDateChange,
  onRepositoryChange,
  onClassificationTypeChange,
  onComplexityIndexChange,
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
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="pr-activity-type-label">{t('filters.classificationType')}</InputLabel>
          <Select
            labelId="pr-activity-type-label"
            label={t('filters.classificationType')}
            value={classificationType}
            onChange={(event) => onClassificationTypeChange(event.target.value)}
            data-testid="pr-activity-classification-type"
          >
            <MenuItem value="">
              <em>{t('filters.allClassificationTypes')}</em>
            </MenuItem>
            {CLASSIFICATION_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>
                {t(`classification.${type}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="pr-activity-complexity-label">{t('filters.complexityIndex')}</InputLabel>
          <Select
            labelId="pr-activity-complexity-label"
            label={t('filters.complexityIndex')}
            value={complexityIndex}
            onChange={(event) => onComplexityIndexChange(event.target.value)}
            data-testid="pr-activity-complexity-index"
          >
            <MenuItem value="">
              <em>{t('filters.allComplexityIndexes')}</em>
            </MenuItem>
            {COMPLEXITY_INDEX_OPTIONS.map((index) => (
              <MenuItem key={index} value={String(index)}>
                {index}
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
