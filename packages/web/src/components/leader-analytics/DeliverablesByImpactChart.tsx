import { useMemo } from 'react';
import { Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslation } from 'react-i18next';
import type { ImpactBucketRow, TeamAnalyticsResponse } from '../../services/leaderAnalyticsApi.js';
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
import {
  BUSINESS_IMPACT_COLORS,
  BUSINESS_IMPACT_I18N_KEYS,
  BUSINESS_IMPACT_LEVELS,
} from './businessImpactStyles.js';
import { buildAscendingWeekAxis } from '../../utils/isoWeekLabel.js';

type DeliverablesByImpactChartProps = {
  analytics: TeamAnalyticsResponse | null;
  dateFormatPreference?: DateFormatPreference;
  languagePreference?: LanguagePreference;
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

export default function DeliverablesByImpactChart({
  analytics,
  dateFormatPreference = DEFAULT_DATE_FORMAT_PREFERENCE,
  languagePreference = DEFAULT_LANGUAGE_PREFERENCE,
}: DeliverablesByImpactChartProps) {
  const { t } = useTranslation(['leader', 'common']);
  const { weekStarts, labels: weekLabels } = useMemo(
    () =>
      buildAscendingWeekAxis(
        analytics?.weekStarts ?? [],
        dateFormatPreference,
        languagePreference,
      ),
    [analytics?.weekStarts, dateFormatPreference, languagePreference],
  );

  const matrix = useMemo(
    () => buildImpactMatrix(weekStarts, analytics?.deliverablesByWeekAndImpact ?? []),
    [weekStarts, analytics?.deliverablesByWeekAndImpact],
  );

  const impactLegendItems = useMemo(
    () =>
      BUSINESS_IMPACT_LEVELS.map((impact) => ({
        id: impact,
        label: t(BUSINESS_IMPACT_I18N_KEYS[impact], { ns: 'common' }),
        color: BUSINESS_IMPACT_COLORS[impact],
      })),
    [t],
  );

  if (weekStarts.length === 0) {
    return (
      <Paper variant="outlined" sx={analyticsWidgetPaperSx}>
        <AnalyticsWidgetTitle gutterBottom>
          {t('charts.deliverablesByWeekTitle')}
        </AnalyticsWidgetTitle>
        <Typography color="text.secondary">{t('charts.noData')}</Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ ...analyticsWidgetPaperSx, overflow: 'hidden' }}>
      <AnalyticsWidgetTitle sx={{ mb: 1 }}>{t('charts.deliverablesByWeekTitle')}</AnalyticsWidgetTitle>
      <ChartResizeContainer minHeight={200}>
        {(containerHeight) => (
          <ChartWithLegendLayout
            containerHeight={containerHeight}
            data-testid="impact-chart"
            legend={<ChartLegend items={impactLegendItems} data-testid="impact-chart-legend" />}
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
                  label: t(BUSINESS_IMPACT_I18N_KEYS[impact], { ns: 'common' }),
                  data: weekStarts.map((week) => matrix[week]?.[impact] ?? 0),
                  stack: 'total',
                  color: BUSINESS_IMPACT_COLORS[impact],
                }))}
                colors={BUSINESS_IMPACT_LEVELS.map((impact) => BUSINESS_IMPACT_COLORS[impact])}
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
