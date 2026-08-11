import { Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslation } from 'react-i18next';
import type { AuthoredWeekBucket } from '../../utils/myPullRequestActivity.js';

type AuthoredPrsChartProps = {
  series: AuthoredWeekBucket[];
};

export default function AuthoredPrsChart({ series }: AuthoredPrsChartProps) {
  const { t } = useTranslation('prActivity');
  const total = series.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }} data-testid="authored-prs-chart">
      <Typography variant="h6" component="h2" gutterBottom>
        {t('chart.title')}
      </Typography>
      {total === 0 ? (
        <Typography color="text.secondary">{t('chart.empty')}</Typography>
      ) : (
        <BarChart
          height={260}
          series={[{ data: series.map((bucket) => bucket.count), label: t('chart.series') }]}
          xAxis={[{ data: series.map((bucket) => bucket.label), scaleType: 'band' }]}
          margin={{ left: 40, right: 16, top: 24, bottom: 40 }}
        />
      )}
    </Paper>
  );
}
