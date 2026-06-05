import { useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

type ChartWithLegendLayoutProps = {
  containerHeight: number;
  legend: ReactNode;
  renderChart: (plotHeight: number) => ReactNode;
  'data-testid'?: string;
};

/**
 * Stacks plot + legend with no gap: plot row uses all space above the legend's natural height.
 */
export default function ChartWithLegendLayout({
  containerHeight,
  legend,
  renderChart,
  'data-testid': testId,
}: ChartWithLegendLayoutProps) {
  const plotAreaRef = useRef<HTMLDivElement>(null);
  const [plotHeight, setPlotHeight] = useState(Math.max(120, containerHeight - 28));

  useLayoutEffect(() => {
    const plotArea = plotAreaRef.current;
    if (!plotArea) {
      return;
    }

    const updatePlotHeight = () => {
      const next = Math.max(120, Math.floor(plotArea.clientHeight));
      setPlotHeight((current) => (current === next ? current : next));
    };

    updatePlotHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(updatePlotHeight);
    observer.observe(plotArea);

    return () => observer.disconnect();
  }, [containerHeight]);

  return (
    <Box
      data-testid={testId}
      sx={{
        width: '100%',
        height: containerHeight,
        display: 'grid',
        gridTemplateRows: '1fr auto',
        minHeight: 0,
      }}
    >
      <Box ref={plotAreaRef} sx={{ minHeight: 0, overflow: 'hidden' }}>
        {plotHeight > 0 ? renderChart(plotHeight) : null}
      </Box>
      <Box sx={{ flexShrink: 0, minHeight: 0 }}>{legend}</Box>
    </Box>
  );
}
