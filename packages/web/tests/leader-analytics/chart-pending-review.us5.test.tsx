import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PendingReviewWidget from '../../src/components/leader-analytics/PendingReviewWidget.js';

describe('US5 pending review widget', () => {
  it('shows total and per-impact counts with impact labels', () => {
    render(
      <PendingReviewWidget
        totalCount={7}
        byImpact={[
          { impact: 'LOW', count: 1 },
          { impact: 'MEDIUM', count: 2 },
          { impact: 'HIGH', count: 3 },
          { impact: 'TRANSFORMATIONAL', count: 1 },
        ]}
      />,
    );

    expect(screen.getByTestId('pending-review-total')).toHaveTextContent('7');
    expect(screen.getByTestId('pending-review-impact-HIGH')).toHaveTextContent('3');
    expect(screen.getByTestId('pending-review-by-impact')).toBeVisible();
    expect(screen.getByTestId('pending-review-impact-LOW')).toHaveTextContent('Low');
    expect(screen.getByText(/deliverables pending review/i)).toBeInTheDocument();
    expect(screen.getByText(/total to review/i)).toBeInTheDocument();
  });
});
