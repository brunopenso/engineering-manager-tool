import { Card, CardContent, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type ActivitySummaryCardsProps = {
  commentCount: number;
  reviewCount: number;
};

export default function ActivitySummaryCards({
  commentCount,
  reviewCount,
}: ActivitySummaryCardsProps) {
  const { t } = useTranslation('prActivity');

  return (
    <Stack spacing={2} sx={{ height: '100%' }} data-testid="activity-summary-cards">
      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            {t('cards.comments')}
          </Typography>
          <Typography variant="h3" component="p" data-testid="comment-count">
            {commentCount}
          </Typography>
        </CardContent>
      </Card>
      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            {t('cards.reviews')}
          </Typography>
          <Typography variant="h3" component="p" data-testid="review-count">
            {reviewCount}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
