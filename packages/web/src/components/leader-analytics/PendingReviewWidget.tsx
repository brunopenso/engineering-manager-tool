import { alpha, Box, Paper, Typography } from '@mui/material';
import type { PendingReviewByImpactRow } from '../../services/leaderAnalyticsApi.js';
import AnalyticsWidgetTitle from './AnalyticsWidgetTitle.js';
import { analyticsWidgetPaperSx } from './analyticsWidgetStyles.js';
import {
  BUSINESS_IMPACT_COLORS,
  BUSINESS_IMPACT_LABELS,
  BUSINESS_IMPACT_LEVELS,
} from './businessImpactStyles.js';

type PendingReviewWidgetProps = {
  totalCount: number;
  byImpact: PendingReviewByImpactRow[];
};

function countForImpact(byImpact: PendingReviewByImpactRow[], impact: string): number {
  return byImpact.find((row) => row.impact === impact)?.count ?? 0;
}

export default function PendingReviewWidget({ totalCount, byImpact }: PendingReviewWidgetProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        ...analyticsWidgetPaperSx,
        overflow: 'auto',
        gap: 1,
      }}
      data-testid="pending-review-widget"
    >
      <AnalyticsWidgetTitle>Deliverables pending review</AnalyticsWidgetTitle>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 1.5,
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            textAlign: 'center',
            px: 1,
            py: 0.5,
            alignSelf: { xs: 'center', md: 'center' },
          }}
        >
          <Typography
            variant="h3"
            component="p"
            color="text.primary"
            data-testid="pending-review-total"
            sx={{ fontWeight: 700, lineHeight: 1.1, m: 0 }}
          >
            {totalCount}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            total to review
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 1,
            flex: 1,
            width: '100%',
            minWidth: 0,
          }}
          data-testid="pending-review-by-impact"
        >
          {BUSINESS_IMPACT_LEVELS.map((impact) => {
            const color = BUSINESS_IMPACT_COLORS[impact];
            const count = countForImpact(byImpact, impact);

            return (
              <Box
                key={impact}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.25,
                  px: 0.5,
                  py: 0.75,
                  borderRadius: 1,
                  bgcolor: alpha(color, 0.12),
                  borderTop: 3,
                  borderColor: color,
                }}
                data-testid={`pending-review-impact-${impact}`}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center', lineHeight: 1.2, fontSize: '0.65rem' }}
                  noWrap
                >
                  {BUSINESS_IMPACT_LABELS[impact]}
                </Typography>
                <Typography
                  variant="h6"
                  component="span"
                  sx={{ fontWeight: 700, color, lineHeight: 1 }}
                >
                  {count}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
