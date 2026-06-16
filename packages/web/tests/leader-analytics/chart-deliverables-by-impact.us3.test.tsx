import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DeliverablesByImpactChart from '../../src/components/leader-analytics/DeliverablesByImpactChart.js';
import { renderWithI18n } from '../../src/test/renderWithProviders.js';

describe('US3 deliverables by impact chart', () => {
  it('renders impact chart with week axis', () => {
    renderWithI18n(
      <DeliverablesByImpactChart
        analytics={{
          startDate: '2026-04-01',
          endDate: '2026-05-15',
          weekStarts: ['2026-04-07', '2026-04-14'],
          deliverablesByWeekAndImpact: [
            { weekStart: '2026-04-07', impact: 'HIGH', count: 2 },
            { weekStart: '2026-04-14', impact: 'LOW', count: 1 },
          ],
          engagementByWeek: [],
          pendingReviewCount: 0,
        }}
      />,
    );

    expect(screen.getByTestId('impact-chart')).toBeInTheDocument();
    expect(screen.getByTestId('impact-chart-legend')).toBeInTheDocument();
    expect(screen.getByText(/deliverables by week and impact/i)).toBeInTheDocument();
  });
});
