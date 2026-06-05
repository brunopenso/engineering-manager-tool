import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ImpactBucketRow, TeamAnalyticsResponse } from '../../services/leaderAnalyticsApi.js';
import ChartResizeContainer from './ChartResizeContainer.js';
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

const CHART_MARGINS = { left: 52, right: 16, top: 48, bottom: 64 };

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
      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Deliverables by week and impact
        </Typography>
        <Typography color="text.secondary">No data for the selected filters.</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
        Deliverables by week and impact
      </Typography>
      <ChartResizeContainer minHeight={200}>
        {(chartHeight) => (
          <Box data-testid="impact-chart" sx={{ width: '100%', height: chartHeight }}>
            <BarChart
              height={chartHeight}
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
              margin={CHART_MARGINS}
              slotProps={{
                legend: {
                  position: { vertical: 'top', horizontal: 'right' },
                },
              }}
            />
          </Box>
        )}
      </ChartResizeContainer>
    </Paper>
  );
}
