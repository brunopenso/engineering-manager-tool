import { type ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import { fieldLabelLineColor } from '../../theme/appTheme.js';

type LabeledFieldProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
};

export function LabeledField({ label, htmlFor, children }: LabeledFieldProps) {
  return (
    <Stack spacing={1}>
      <Typography
        variant="overline"
        color="text.secondary"
        {...(htmlFor ? { component: 'label' as const, htmlFor } : { component: 'div' as const })}
        sx={{
          display: 'block',
          lineHeight: 1.5,
          pb: 0.5,
          borderBottom: 1,
          borderColor: (theme) => fieldLabelLineColor[theme.palette.mode],
        }}
      >
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

type LabeledValueProps = {
  label: string;
  value: ReactNode;
};

export function LabeledValue({ label, value }: LabeledValueProps) {
  return (
    <LabeledField label={label}>
      {typeof value === 'string' ? (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </LabeledField>
  );
}
