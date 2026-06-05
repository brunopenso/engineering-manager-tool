import { Box, Typography } from '@mui/material';

export const ENGAGEMENT_CHART_COLORS = [
  '#1976d2',
  '#2e7d32',
  '#ed6c02',
  '#9c27b0',
  '#0288d1',
  '#00796b',
  '#c62828',
  '#5e35b1',
  '#f9a825',
  '#6d4c41',
  '#00838f',
  '#558b2f',
] as const;

type EngagementChartLegendProps = {
  items: { id: string; label: string }[];
};

export default function EngagementChartLegend({ items }: EngagementChartLegendProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Box
      component="ul"
      data-testid="engagement-chart-legend"
      sx={{
        listStyle: 'none',
        m: 0,
        mt: 1,
        p: 0,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 1.5,
        flexShrink: 0,
        maxHeight: 96,
        overflowY: 'auto',
      }}
    >
      {items.map((item, index) => {
        const color = ENGAGEMENT_CHART_COLORS[index % ENGAGEMENT_CHART_COLORS.length];

        return (
          <Box
            component="li"
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              maxWidth: '100%',
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                bgcolor: color,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" noWrap title={item.label}>
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
