import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

type HierarchyRoleChipsProps = {
  isLeader: boolean;
};

export default function HierarchyRoleChips({ isLeader }: HierarchyRoleChipsProps) {
  const { t } = useTranslation('common');

  if (!isLeader) {
    return null;
  }

  return <Chip size="small" label={t('roles.leader')} color="error" data-testid="role-leader" />;
}
