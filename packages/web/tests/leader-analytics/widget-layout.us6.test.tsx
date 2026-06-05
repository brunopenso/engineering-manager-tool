import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import AnalyticsWidgetGrid from '../../src/components/leader-analytics/AnalyticsWidgetGrid.js';

describe('US6 analytics widget layout', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders widget grid with child widgets', () => {
    render(
      <AnalyticsWidgetGrid
        widgets={{
          impact: <div data-testid="impact-widget">Impact</div>,
          engagement: <div data-testid="engagement-widget">Engagement</div>,
          pendingReview: <div data-testid="pending-widget">Pending</div>,
        }}
      />,
    );

    expect(screen.getByTestId('analytics-widget-grid')).toBeInTheDocument();
    expect(screen.getByTestId('impact-widget')).toBeInTheDocument();
    expect(screen.getByTestId('engagement-widget')).toBeInTheDocument();
    expect(screen.getByTestId('pending-widget')).toBeInTheDocument();
  });

  it('restores layout from sessionStorage', () => {
    sessionStorage.setItem(
      'em-tool:leader-analytics-layout:v4',
      JSON.stringify([
        { i: 'pending-review', x: 0, y: 0, w: 4, h: 2 },
        { i: 'impact', x: 0, y: 2, w: 12, h: 4 },
        { i: 'engagement', x: 0, y: 6, w: 12, h: 4 },
      ]),
    );

    render(
      <AnalyticsWidgetGrid
        widgets={{
          impact: <div data-testid="impact-widget">Impact</div>,
          engagement: <div data-testid="engagement-widget">Engagement</div>,
          pendingReview: <div data-testid="pending-widget">Pending</div>,
        }}
      />,
    );

    const stored = sessionStorage.getItem('em-tool:leader-analytics-layout:v4');
    expect(stored).toContain('pending-review');
  });
});
