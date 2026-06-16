import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EngagementByUserChart from '../../src/components/leader-analytics/EngagementByUserChart.js';
import { AppThemeProvider } from '../../src/theme/AppThemeProvider.js';

describe('US4 engagement chart', () => {
  it('renders engagement chart for per-user series', () => {
    render(
      <AppThemeProvider>
        <EngagementByUserChart
          analytics={{
            startDate: '2026-04-01',
            endDate: '2026-05-15',
            weekStarts: ['2026-04-07'],
            deliverablesByWeekAndImpact: [],
            engagementByWeek: [
              {
                weekStart: '2026-04-07',
                userId: 'report-1',
                displayName: 'Alice',
                count: 1,
              },
            ],
            pendingReviewCount: 0,
          }}
        />
      </AppThemeProvider>,
    );

    expect(screen.getByTestId('engagement-chart')).toBeInTheDocument();
    expect(screen.getByTestId('engagement-chart-legend')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
