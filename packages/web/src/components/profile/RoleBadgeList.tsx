import { Chip, Stack } from '@mui/material';
import type { AuthUser } from '../../auth/AuthProvider.js';

const ROLE_LABELS: Record<AuthUser['roles'][number], string> = {
  COLLABORATOR: 'Collaborator',
  LEADER: 'Leader',
  ADMINISTRATOR: 'Administrator',
};

type RoleBadgeListProps = {
  roles: AuthUser['roles'];
};

export default function RoleBadgeList({ roles }: RoleBadgeListProps) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {roles.map((role) => (
        <Chip
          key={role}
          label={ROLE_LABELS[role]}
          color={role === 'ADMINISTRATOR' ? 'primary' : 'default'}
          variant={role === 'COLLABORATOR' ? 'outlined' : 'filled'}
        />
      ))}
    </Stack>
  );
}
