import { Card, CardContent, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { PerformanceTotals } from '../../services/leaderPrPerformanceApi.js';

type TeamPrPerformanceSummaryCardsProps = {
  totals: PerformanceTotals;
};

export default function TeamPrPerformanceSummaryCards({
  totals,
}: TeamPrPerformanceSummaryCardsProps) {
  const { t } = useTranslation('leader');

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      data-testid="pr-performance-summary-cards"
    >
      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            {t('teamPrPerformance.cards.authored')}
          </Typography>
          <Typography variant="h3" component="p" data-testid="pr-performance-authored-count">
            {totals.authoredPullRequestCount}
          </Typography>
        </CardContent>
      </Card>
      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            {t('teamPrPerformance.cards.comments')}
          </Typography>
          <Typography variant="h3" component="p" data-testid="pr-performance-comment-count">
            {totals.commentCount}
          </Typography>
        </CardContent>
      </Card>
      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            {t('teamPrPerformance.cards.reviews')}
          </Typography>
          <Typography variant="h3" component="p" data-testid="pr-performance-review-count">
            {totals.reviewCount}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
