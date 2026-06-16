import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EngagementByUserChart from '../../src/components/leader-analytics/EngagementByUserChart.js';
import { renderWithI18n } from '../../src/test/renderWithProviders.js';

describe('US4 engagement chart', () => {
  it('renders engagement chart for per-user series', () => {
    renderWithI18n(
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
    );

    expect(screen.getByTestId('engagement-chart')).toBeInTheDocument();
    expect(screen.getByTestId('engagement-chart-legend')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
