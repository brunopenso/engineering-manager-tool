import type { SxProps, Theme } from '@mui/material';

/** Shared Paper shell for leader analytics widgets (matches pending-review widget). */
export const analyticsWidgetPaperSx: SxProps<Theme> = {
  p: 1.5,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
};

/** Widget title: Typography subtitle1, semibold (Deliverables pending review pattern). */
export const analyticsWidgetTitleSx: SxProps<Theme> = {
  flexShrink: 0,
  fontWeight: 600,
  lineHeight: 1.3,
};

/** Chart legend item labels — same font size and family across widgets. */
export const analyticsChartLegendLabelSx: SxProps<Theme> = {
  lineHeight: 1.2,
  fontSize: '0.75rem',
};

/** Reserved height below the plot for a horizontal legend row. */
export const ANALYTICS_CHART_LEGEND_MIN_HEIGHT = 48;
