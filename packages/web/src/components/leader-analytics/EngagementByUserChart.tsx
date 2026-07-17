import { useMemo } from 'react';
import { Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslation } from 'react-i18next';
import type { EngagementBucketRow, TeamAnalyticsResponse } from '../../services/leaderAnalyticsApi.js';
import type { DateFormatPreference, LanguagePreference } from '../../types/profilePreferences.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../../types/profilePreferences.js';
import AnalyticsWidgetTitle from './AnalyticsWidgetTitle.js';
import ChartLegend from './ChartLegend.js';
import ChartResizeContainer from './ChartResizeContainer.js';
import ChartWithLegendLayout from './ChartWithLegendLayout.js';
import { analyticsChartPlotMargins, analyticsWidgetPaperSx } from './analyticsWidgetStyles.js';
import { ENGAGEMENT_CHART_COLORS } from './engagementChartColors.js';
import { buildAscendingWeekAxis } from '../../utils/isoWeekLabel.js';

const MAX_LEGEND_USERS = 12;

type EngagementByUserChartProps = {
  analytics: TeamAnalyticsResponse | null;
  dateFormatPreference?: DateFormatPreference;
  languagePreference?: LanguagePreference;
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

export default function EngagementByUserChart({
  analytics,
  dateFormatPreference = DEFAULT_DATE_FORMAT_PREFERENCE,
  languagePreference = DEFAULT_LANGUAGE_PREFERENCE,
}: EngagementByUserChartProps) {
  const { t } = useTranslation('leader');
  const { weekStarts, labels: weekLabels } = useMemo(
    () =>
      buildAscendingWeekAxis(
        analytics?.weekStarts ?? [],
        dateFormatPreference,
        languagePreference,
      ),
    [analytics?.weekStarts, dateFormatPreference, languagePreference],
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
        color: ENGAGEMENT_CHART_COLORS[index % ENGAGEMENT_CHART_COLORS.length],
      })),
    };
  }, [rows, weekStarts]);

  if (weekStarts.length === 0) {
    return (
      <Paper variant="outlined" sx={analyticsWidgetPaperSx}>
        <AnalyticsWidgetTitle gutterBottom>{t('charts.engagementTitle')}</AnalyticsWidgetTitle>
        <Typography color="text.secondary">{t('charts.noData')}</Typography>
      </Paper>
    );
  }

  if (seriesUserIds.length === 0) {
    return (
      <Paper variant="outlined" sx={analyticsWidgetPaperSx}>
        <AnalyticsWidgetTitle gutterBottom>{t('charts.engagementTitle')}</AnalyticsWidgetTitle>
        <Typography color="text.secondary">{t('charts.noEngagementInPeriod')}</Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ ...analyticsWidgetPaperSx, overflow: 'hidden' }}>
      <AnalyticsWidgetTitle sx={{ mb: 1 }}>{t('charts.engagementTitle')}</AnalyticsWidgetTitle>
      {rows.length > 0 && seriesUserIds.length < new Set(rows.map((row) => row.userId)).size ? (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, flexShrink: 0 }}>
          {t('charts.topContributors', { max: MAX_LEGEND_USERS })}
        </Typography>
      ) : null}
      <ChartResizeContainer minHeight={200}>
        {(containerHeight) => (
          <ChartWithLegendLayout
            containerHeight={containerHeight}
            data-testid="engagement-chart"
            legend={<ChartLegend items={legendItems} data-testid="engagement-chart-legend" />}
            renderChart={(plotHeight) => (
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
                margin={analyticsChartPlotMargins}
                hideLegend
              />
            )}
          />
        )}
      </ChartResizeContainer>
    </Paper>
  );
}
