import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { EngagementBucketRow, TeamAnalyticsResponse } from '../../services/leaderAnalyticsApi.js';
import ChartResizeContainer from './ChartResizeContainer.js';
import EngagementChartLegend, { ENGAGEMENT_CHART_COLORS } from './EngagementChartLegend.js';
import { buildAscendingIsoWeekAxis } from '../../utils/isoWeekLabel.js';

const MAX_LEGEND_USERS = 12;

const PLOT_MARGINS = { left: 52, right: 16, top: 16, bottom: 56 };
const LEGEND_AREA_MIN_HEIGHT = 48;

type EngagementByUserChartProps = {
  analytics: TeamAnalyticsResponse | null;
};

function topUsersByTotalAdds(rows: EngagementBucketRow[]): string[] {
  const totals = new Map<string, { userId: string; displayName: string; total: number }>();

  for (const row of rows) {
    const current = totals.get(row.userId) ?? {
      userId: row.userId,
      displayName: row.displayName,
      total: 0,
    };
    current.total += row.count;
    totals.set(row.userId, current);
  }

  return [...totals.values()]
    .sort((left, right) => right.total - left.total || left.displayName.localeCompare(right.displayName))
    .slice(0, MAX_LEGEND_USERS)
    .map((entry) => entry.userId);
}

export default function EngagementByUserChart({ analytics }: EngagementByUserChartProps) {
  const { weekStarts, labels: weekLabels } = useMemo(
    () => buildAscendingIsoWeekAxis(analytics?.weekStarts ?? []),
    [analytics?.weekStarts],
  );
  const rows = analytics?.engagementByWeek ?? [];

  const { seriesUserIds, seriesLabels, seriesData, legendItems } = useMemo(() => {
    const userIds = topUsersByTotalAdds(rows);
    const labels = userIds.map((userId) => {
      const match = rows.find((row) => row.userId === userId);
      return match?.displayName ?? userId;
    });

    const data = userIds.map((userId) =>
      weekStarts.map((week) => {
        const match = rows.find((row) => row.userId === userId && row.weekStart === week);
        return match?.count ?? 0;
      }),
    );

    return {
      seriesUserIds: userIds,
      seriesLabels: labels,
      seriesData: data,
      legendItems: userIds.map((userId, index) => ({
        id: userId,
        label: labels[index] ?? userId,
      })),
    };
  }, [rows, weekStarts]);

  if (weekStarts.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Team engagement (adds per week)
        </Typography>
        <Typography color="text.secondary">No data for the selected filters.</Typography>
      </Paper>
    );
  }

  if (seriesUserIds.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Team engagement (adds per week)
        </Typography>
        <Typography color="text.secondary">
          No deliverables were added in this period for the selected team scope.
        </Typography>
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
        Team engagement (adds per week)
      </Typography>
      {rows.length > 0 && seriesUserIds.length < new Set(rows.map((row) => row.userId)).size ? (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, flexShrink: 0 }}>
          Showing top {MAX_LEGEND_USERS} contributors by total adds in range.
        </Typography>
      ) : null}
      <ChartResizeContainer minHeight={200}>
        {(containerHeight) => {
          const plotHeight = Math.max(160, containerHeight - LEGEND_AREA_MIN_HEIGHT);

          return (
            <Box
              data-testid="engagement-chart"
              sx={{
                width: '100%',
                height: containerHeight,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
                <BarChart
                  height={plotHeight}
                  colors={[...ENGAGEMENT_CHART_COLORS]}
                  xAxis={[
                    {
                      data: weekLabels,
                      scaleType: 'band',
                      tickLabelStyle: { fontSize: 11 },
                    },
                  ]}
                  series={seriesLabels.map((label, index) => ({
                    id: seriesUserIds[index],
                    label,
                    data: seriesData[index],
                  }))}
                  margin={PLOT_MARGINS}
                  slotProps={{
                    legend: {
                      hidden: true,
                    },
                  }}
                />
              </Box>
              <EngagementChartLegend items={legendItems} />
            </Box>
          );
        }}
      </ChartResizeContainer>
    </Paper>
  );
}
