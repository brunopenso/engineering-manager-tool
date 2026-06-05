import { Typography, type TypographyProps } from '@mui/material';
import { analyticsWidgetTitleSx } from './analyticsWidgetStyles.js';

type AnalyticsWidgetTitleProps = TypographyProps;

export default function AnalyticsWidgetTitle({ children, sx, ...rest }: AnalyticsWidgetTitleProps) {
  return (
    <Typography variant="subtitle1" sx={[analyticsWidgetTitleSx, sx]} {...rest}>
      {children}
    </Typography>
  );
}
