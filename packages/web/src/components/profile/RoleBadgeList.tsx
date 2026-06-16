import { Chip, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AuthUser } from '../../auth/AuthProvider.js';

type RoleBadgeListProps = {
  roles: AuthUser['roles'];
};

export default function RoleBadgeList({ roles }: RoleBadgeListProps) {
  const { t } = useTranslation('common');

  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {roles.map((role) => (
        <Chip
          key={role}
          label={t(`roles.${role}`)}
          color={role === 'ADMINISTRATOR' ? 'primary' : 'default'}
          variant={role === 'COLLABORATOR' ? 'outlined' : 'filled'}
        />
      ))}
    </Stack>
  );
}
