import { useMemo } from 'react';
import { Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ImpactBucketRow, TeamAnalyticsResponse } from '../../services/leaderAnalyticsApi.js';
import AnalyticsWidgetTitle from './AnalyticsWidgetTitle.js';
import ChartLegend from './ChartLegend.js';
import ChartResizeContainer from './ChartResizeContainer.js';
import ChartWithLegendLayout from './ChartWithLegendLayout.js';
import { analyticsChartPlotMargins, analyticsWidgetPaperSx } from './analyticsWidgetStyles.js';
import {
  BUSINESS_IMPACT_COLORS,
  BUSINESS_IMPACT_LABELS,
  BUSINESS_IMPACT_LEVELS,
} from './businessImpactStyles.js';
import { buildAscendingIsoWeekAxis } from '../../utils/isoWeekLabel.js';

type DeliverablesByImpactChartProps = {
  analytics: TeamAnalyticsResponse | null;
};

function buildImpactMatrix(
  weekStarts: string[],
  rows: ImpactBucketRow[],
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};

  for (const week of weekStarts) {
    matrix[week] = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      TRANSFORMATIONAL: 0,
    };
  }

  for (const row of rows) {
    if (!matrix[row.weekStart]) {
      matrix[row.weekStart] = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        TRANSFORMATIONAL: 0,
      };
    }

    matrix[row.weekStart][row.impact] = row.count;
  }

  return matrix;
}

const IMPACT_LEGEND_ITEMS = BUSINESS_IMPACT_LEVELS.map((impact) => ({
  id: impact,
  label: BUSINESS_IMPACT_LABELS[impact],
  color: BUSINESS_IMPACT_COLORS[impact],
}));

export default function DeliverablesByImpactChart({ analytics }: DeliverablesByImpactChartProps) {
  const { weekStarts, labels: weekLabels } = useMemo(
    () => buildAscendingIsoWeekAxis(analytics?.weekStarts ?? []),
    [analytics?.weekStarts],
  );

  const matrix = useMemo(
    () => buildImpactMatrix(weekStarts, analytics?.deliverablesByWeekAndImpact ?? []),
    [weekStarts, analytics?.deliverablesByWeekAndImpact],
  );

  if (weekStarts.length === 0) {
    return (
      <Paper variant="outlined" sx={analyticsWidgetPaperSx}>
        <AnalyticsWidgetTitle gutterBottom>Deliverables by week and impact</AnalyticsWidgetTitle>
        <Typography color="text.secondary">No data for the selected filters.</Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ ...analyticsWidgetPaperSx, overflow: 'hidden' }}>
      <AnalyticsWidgetTitle sx={{ mb: 1 }}>Deliverables by week and impact</AnalyticsWidgetTitle>
      <ChartResizeContainer minHeight={200}>
        {(containerHeight) => (
          <ChartWithLegendLayout
            containerHeight={containerHeight}
            data-testid="impact-chart"
            legend={<ChartLegend items={IMPACT_LEGEND_ITEMS} data-testid="impact-chart-legend" />}
            renderChart={(plotHeight) => (
              <BarChart
                height={plotHeight}
                xAxis={[
                  {
                    data: weekLabels,
                    scaleType: 'band',
                    tickLabelStyle: { fontSize: 11 },
                  },
                ]}
                series={BUSINESS_IMPACT_LEVELS.map((impact) => ({
                  id: impact,
                  label: BUSINESS_IMPACT_LABELS[impact],
                  data: weekStarts.map((week) => matrix[week]?.[impact] ?? 0),
                  stack: 'total',
                  color: BUSINESS_IMPACT_COLORS[impact],
                }))}
                colors={BUSINESS_IMPACT_LEVELS.map((impact) => BUSINESS_IMPACT_COLORS[impact])}
                margin={analyticsChartPlotMargins}
                slotProps={{
                  legend: {
                    hidden: true,
                  },
                }}
              />
            )}
          />
        )}
      </ChartResizeContainer>
    </Paper>
  );
}
