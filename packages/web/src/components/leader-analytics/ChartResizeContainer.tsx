import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Box } from '@mui/material';

type ChartResizeContainerProps = {
  children: (height: number) => ReactNode;
  minHeight?: number;
};

export default function ChartResizeContainer({
  children,
  minHeight = 180,
}: ChartResizeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateHeight = () => {
      const nextHeight = Math.max(minHeight, Math.floor(element.clientHeight));
      setHeight((current) => (current === nextHeight ? current : nextHeight));
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [minHeight]);

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        minHeight: 0,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {height > 0 ? children(height) : null}
    </Box>
  );
}
