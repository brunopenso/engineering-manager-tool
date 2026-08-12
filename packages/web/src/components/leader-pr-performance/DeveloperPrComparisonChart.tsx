import { useMemo } from 'react';
import { Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslation } from 'react-i18next';
import type { DeveloperPrPerformanceRow } from '../../services/leaderPrPerformanceApi.js';

const MAX_DEVELOPERS = 12;

type DeveloperPrComparisonChartProps = {
  developers: DeveloperPrPerformanceRow[];
};

export default function DeveloperPrComparisonChart({
  developers,
}: DeveloperPrComparisonChartProps) {
  const { t } = useTranslation('leader');

  const chartDevelopers = useMemo(() => developers.slice(0, MAX_DEVELOPERS), [developers]);
  const labels = chartDevelopers.map((row) => row.displayName || row.email);
  const authored = chartDevelopers.map((row) => row.authoredPullRequestCount);
  const comments = chartDevelopers.map((row) => row.commentCount);
  const reviews = chartDevelopers.map((row) => row.reviewCount);

  return (
    <Paper variant="outlined" sx={{ p: 2 }} data-testid="pr-performance-comparison-chart">
      <Typography variant="h6" component="h2" gutterBottom>
        {t('teamPrPerformance.comparisonTitle')}
      </Typography>
      {developers.length > MAX_DEVELOPERS ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {t('teamPrPerformance.topDevelopers', { max: MAX_DEVELOPERS })}
        </Typography>
      ) : null}
      {chartDevelopers.length === 0 ? (
        <Typography color="text.secondary">{t('teamPrPerformance.noComparisonData')}</Typography>
      ) : (
        <BarChart
          height={320}
          xAxis={[{ data: labels, scaleType: 'band', tickLabelStyle: { fontSize: 11 } }]}
          series={[
            { data: authored, label: t('teamPrPerformance.cards.authored'), id: 'authored' },
            { data: comments, label: t('teamPrPerformance.cards.comments'), id: 'comments' },
            { data: reviews, label: t('teamPrPerformance.cards.reviews'), id: 'reviews' },
          ]}
          margin={{ left: 40, right: 16, top: 40, bottom: 60 }}
        />
      )}
    </Paper>
  );
}
