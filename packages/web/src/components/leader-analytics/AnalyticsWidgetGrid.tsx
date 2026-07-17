import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box } from '@mui/material';
import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

const LAYOUT_STORAGE_KEY = 'em-tool:leader-analytics-layout:v4';

const DEFAULT_LAYOUT: Layout = [
  { i: 'pending-review', x: 0, y: 0, w: 12, h: 3, minW: 4, minH: 3 },
  { i: 'impact', x: 0, y: 2, w: 12, h: 5, minW: 6, minH: 4 },
  { i: 'engagement', x: 0, y: 7, w: 12, h: 5, minW: 6, minH: 4 },
];

type AnalyticsWidgetGridProps = {
  widgets: {
    impact: ReactNode;
    engagement: ReactNode;
    pendingReview: ReactNode;
  };
};

function readStoredLayout(): Layout | null {
  try {
    const raw = sessionStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Layout;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const ids = new Set(parsed.map((item) => item.i));
    if (!ids.has('impact') || !ids.has('engagement') || !ids.has('pending-review')) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export default function AnalyticsWidgetGrid({ widgets }: AnalyticsWidgetGridProps) {
  const [layout, setLayout] = useState<Layout>(() => readStoredLayout() ?? DEFAULT_LAYOUT);
  const [gridWidth, setGridWidth] = useState(1200);

  const widgetMap = useMemo(
    () => ({
      impact: widgets.impact,
      engagement: widgets.engagement,
      'pending-review': widgets.pendingReview,
    }),
    [widgets],
  );

  useEffect(() => {
    sessionStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('leader-analytics-grid-container');
      if (container) {
        setGridWidth(container.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleLayoutChange = useCallback((nextLayout: Layout) => {
    setLayout(nextLayout);
  }, []);

  return (
    <Box id="leader-analytics-grid-container" data-testid="analytics-widget-grid">
      <GridLayout
        className="layout"
        layout={layout}
        width={gridWidth}
        gridConfig={{ cols: 12, rowHeight: 60 }}
        dragConfig={{ handle: '.widget-drag-handle' }}
        onLayoutChange={handleLayoutChange}
      >
        {layout.map((item) => (
          <Box
            key={item.i}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box
              className="widget-drag-handle"
              sx={{
                height: 4,
                flexShrink: 0,
                cursor: 'move',
                bgcolor: 'action.hover',
                borderRadius: 1,
                mb: 0.5,
              }}
            />
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {widgetMap[item.i as keyof typeof widgetMap]}
            </Box>
          </Box>
        ))}
      </GridLayout>
    </Box>
  );
}
