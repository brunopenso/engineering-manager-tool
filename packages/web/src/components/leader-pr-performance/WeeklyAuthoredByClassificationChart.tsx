import { useMemo } from 'react';
import { Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslation } from 'react-i18next';
import type {
  PrPerformanceClassification,
  TeamPrPerformanceResponse,
} from '../../services/leaderPrPerformanceApi.js';
import type { DateFormatPreference, LanguagePreference } from '../../types/profilePreferences.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../../types/profilePreferences.js';
import { buildAscendingWeekAxis } from '../../utils/isoWeekLabel.js';

export const PR_CLASSIFICATION_ORDER: PrPerformanceClassification[] = [
  'feature',
  'fix',
  'documentation',
  'maintenance',
  'unclassified',
];

export const PR_CLASSIFICATION_COLORS: Record<PrPerformanceClassification, string> = {
  feature: '#1976d2',
  fix: '#ed6c02',
  documentation: '#2e7d32',
  maintenance: '#6d4c41',
  unclassified: '#757575',
};

type WeeklyAuthoredByClassificationChartProps = {
  performance: TeamPrPerformanceResponse | null;
  dateFormatPreference?: DateFormatPreference;
  languagePreference?: LanguagePreference;
};

export default function WeeklyAuthoredByClassificationChart({
  performance,
  dateFormatPreference = DEFAULT_DATE_FORMAT_PREFERENCE,
  languagePreference = DEFAULT_LANGUAGE_PREFERENCE,
}: WeeklyAuthoredByClassificationChartProps) {
  const { t } = useTranslation('leader');
  const { weekStarts, labels: weekLabels } = useMemo(
    () =>
      buildAscendingWeekAxis(
        performance?.weekStarts ?? [],
        dateFormatPreference,
        languagePreference,
      ),
    [performance?.weekStarts, dateFormatPreference, languagePreference],
  );

  const series = useMemo(() => {
    const rows = performance?.authoredByWeekAndClassification ?? [];
    return PR_CLASSIFICATION_ORDER.map((classification) => ({
      id: classification,
      label: t(`teamPrPerformance.classification.${classification}`),
      color: PR_CLASSIFICATION_COLORS[classification],
      data: weekStarts.map((week) => {
        const match = rows.find(
          (row) => row.weekStart === week && row.classification === classification,
        );
        return match?.count ?? 0;
      }),
      stack: 'authored',
    }));
  }, [performance?.authoredByWeekAndClassification, t, weekStarts]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }} data-testid="pr-performance-classification-chart">
      <Typography variant="h6" component="h2" gutterBottom>
        {t('teamPrPerformance.classificationChartTitle')}
      </Typography>
      {weekStarts.length === 0 ? (
        <Typography color="text.secondary">
          {t('teamPrPerformance.noClassificationData')}
        </Typography>
      ) : (
        <BarChart
          height={320}
          xAxis={[{ data: weekLabels, scaleType: 'band', tickLabelStyle: { fontSize: 11 } }]}
          series={series}
          margin={{ left: 40, right: 16, top: 40, bottom: 60 }}
        />
      )}
    </Paper>
  );
}
