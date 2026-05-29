import { Chip } from '@mui/material';

type HierarchyRoleChipsProps = {
  isLeader: boolean;
};

export default function HierarchyRoleChips({ isLeader }: HierarchyRoleChipsProps) {
  if (!isLeader) {
    return null;
  }

  return <Chip size="small" label="Leader" color="error" data-testid="role-leader" />;
}
