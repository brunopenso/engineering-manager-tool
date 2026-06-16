import { useMemo, useRef, useState } from 'react';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Box,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItemButton,
  OutlinedInput,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { HierarchyViewNode } from '../../services/usersApi.js';

type TeamMemberHierarchyPickerProps = {
  reports: HierarchyViewNode[];
  selectedUserId: string;
  disabled?: boolean;
  onChange: (userId: string) => void;
};

type HierarchyOptionProps = {
  node: HierarchyViewNode;
  depth: number;
  selectedUserId: string;
  expandedItems: string[];
  onToggle: (nodeId: string) => void;
  onSelect: (node: HierarchyViewNode) => void;
};

function flattenNodes(nodes: HierarchyViewNode[]): HierarchyViewNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children ?? [])]);
}

function HierarchyOption({
  node,
  depth,
  selectedUserId,
  expandedItems,
  onToggle,
  onSelect,
}: HierarchyOptionProps) {
  const { t } = useTranslation(['leader', 'common']);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedItems.includes(node.id);

  return (
    <>
      <ListItemButton
        selected={selectedUserId === node.id}
        onClick={() => onSelect(node)}
        sx={{ alignItems: 'center', gap: 1, pl: 1 + depth * 2 }}
        aria-label={t('picker.selectMemberAria', { name: node.displayName })}
      >
        <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
          {hasChildren ? (
            <IconButton
              size="small"
              edge="start"
              aria-label={
                isExpanded
                  ? t('picker.collapse', { name: node.displayName })
                  : t('picker.expand', { name: node.displayName })
              }
              onClick={(event) => {
                event.stopPropagation();
                onToggle(node.id);
              }}
            >
              {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          ) : null}
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2">{node.displayName}</Typography>
          {node.isLeader ? (
            <Chip size="small" label={t('roles.leader', { ns: 'common' })} color="error" />
          ) : null}
        </Stack>
      </ListItemButton>

      {hasChildren ? (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {children.map((child) => (
              <HierarchyOption
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedUserId={selectedUserId}
                expandedItems={expandedItems}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </List>
        </Collapse>
      ) : null}
    </>
  );
}

export default function TeamMemberHierarchyPicker({
  reports,
  selectedUserId,
  disabled = false,
  onChange,
}: TeamMemberHierarchyPickerProps) {
  const { t } = useTranslation('leader');
  const inputRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const selectedMember = useMemo(
    () => flattenNodes(reports).find((member) => member.id === selectedUserId) ?? null,
    [reports, selectedUserId],
  );
  const open = Boolean(anchorEl);
  const labelShrunk = Boolean(selectedMember) || open;
  const teamMemberLabel = t('picker.teamMember');

  function handleOpen() {
    if (disabled || !inputRef.current) {
      return;
    }

    setAnchorEl(inputRef.current);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleToggle(nodeId: string) {
    setExpandedItems((current) =>
      current.includes(nodeId) ? current.filter((id) => id !== nodeId) : [...current, nodeId],
    );
  }

  function handleSelect(node: HierarchyViewNode) {
    onChange(node.id);
    handleClose();
  }

  return (
    <FormControl disabled={disabled} fullWidth>
      <InputLabel htmlFor="team-member-picker-input" shrink={labelShrunk}>
        {teamMemberLabel}
      </InputLabel>
      <OutlinedInput
        ref={inputRef}
        id="team-member-picker-input"
        readOnly
        notched={labelShrunk}
        label={teamMemberLabel}
        value={selectedMember?.displayName ?? ''}
        onClick={handleOpen}
        inputProps={{
          'data-testid': 'team-member-select',
          readOnly: true,
          'aria-label': selectedMember
            ? t('picker.teamMemberAria', { name: selectedMember.displayName })
            : t('picker.selectMemberPlaceholder'),
          'aria-haspopup': 'dialog',
          'aria-expanded': open ? 'true' : undefined,
        }}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          '& .MuiOutlinedInput-input': {
            cursor: disabled ? 'default' : 'pointer',
          },
        }}
        endAdornment={
          <InputAdornment position="end">
            <ExpandMore fontSize="small" />
          </InputAdornment>
        }
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: anchorEl?.clientWidth ?? 360,
              maxWidth: 420,
              maxHeight: 420,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              boxShadow: 8,
              overflow: 'auto',
            },
          },
        }}
      >
        <Box sx={{ p: 1.5, pb: 0.5 }}>
          <Typography variant="subtitle2">{t('picker.selectCollaborator')}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t('picker.expandLeadersHint')}
          </Typography>
        </Box>
        <List aria-label={t('picker.hierarchyAria')} dense sx={{ pb: 1 }}>
          {reports.map((report) => (
            <HierarchyOption
              key={report.id}
              node={report}
              depth={0}
              selectedUserId={selectedUserId}
              expandedItems={expandedItems}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          ))}
        </List>
      </Popover>
    </FormControl>
  );
}
