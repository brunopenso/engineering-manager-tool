import { Box, Typography } from '@mui/material';
import { analyticsChartLegendLabelSx } from './analyticsWidgetStyles.js';

export type ChartLegendItem = {
  id: string;
  label: string;
  color: string;
};

type ChartLegendProps = {
  items: ChartLegendItem[];
  'data-testid'?: string;
};

export default function ChartLegend({ items, 'data-testid': testId }: ChartLegendProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Box
      component="ul"
      data-testid={testId}
      sx={{
        listStyle: 'none',
        m: 0,
        mt: 0.25,
        py: 0.25,
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
      {items.map((item) => (
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
              bgcolor: item.color,
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" sx={analyticsChartLegendLabelSx} noWrap title={item.label}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
