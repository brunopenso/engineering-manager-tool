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

export type HierarchySelectionScope = 'subtree' | 'itself';

export type HierarchyMemberSelection = {
  userId: string;
  scope: HierarchySelectionScope;
};

type TeamMemberHierarchyPickerProps = {
  reports: HierarchyViewNode[];
  selectedUserId: string;
  selectedScope?: HierarchySelectionScope;
  disabled?: boolean;
  onChange: (selection: HierarchyMemberSelection) => void;
};

type HierarchyOptionProps = {
  node: HierarchyViewNode;
  depth: number;
  selectedUserId: string;
  selectedScope: HierarchySelectionScope;
  expandedItems: string[];
  onToggle: (nodeId: string) => void;
  onSelect: (selection: HierarchyMemberSelection) => void;
};

function flattenNodes(nodes: HierarchyViewNode[]): HierarchyViewNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children ?? [])]);
}

function HierarchyOption({
  node,
  depth,
  selectedUserId,
  selectedScope,
  expandedItems,
  onToggle,
  onSelect,
}: HierarchyOptionProps) {
  const { t } = useTranslation(['leader', 'common']);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedItems.includes(node.id);
  const isSubtreeSelected = selectedUserId === node.id && selectedScope === 'subtree';
  const isItselfSelected = selectedUserId === node.id && selectedScope === 'itself';

  return (
    <>
      <ListItemButton
        selected={isSubtreeSelected || (!hasChildren && isItselfSelected)}
        onClick={() =>
          onSelect({
            userId: node.id,
            scope: hasChildren ? 'subtree' : 'itself',
          })
        }
        sx={{ alignItems: 'center', gap: 1, pl: 1 + depth * 2 }}
        aria-label={
          hasChildren
            ? t('picker.selectMemberAria', { name: node.displayName })
            : t('picker.selectItselfAria', { name: node.displayName })
        }
        data-testid={`team-member-option-${node.id}`}
        data-scope={hasChildren ? 'subtree' : 'itself'}
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
        <ListItemButton
          selected={isItselfSelected}
          onClick={() => onSelect({ userId: node.id, scope: 'itself' })}
          sx={{ alignItems: 'center', gap: 1, pl: 1 + (depth + 1) * 2 }}
          aria-label={t('picker.selectItselfAria', { name: node.displayName })}
          data-testid={`team-member-itself-${node.id}`}
          data-scope="itself"
        >
          <Box sx={{ width: 32 }} />
          <Typography variant="body2" color="text.secondary">
            {t('picker.itself')}
          </Typography>
        </ListItemButton>
      ) : null}

      {hasChildren ? (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {children.map((child) => (
              <HierarchyOption
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedUserId={selectedUserId}
                selectedScope={selectedScope}
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
  selectedScope = 'subtree',
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

  const displayValue = selectedMember
    ? selectedScope === 'itself' || !selectedMember.children?.length
      ? t('picker.scopeItself', { name: selectedMember.displayName })
      : t('picker.scopeSubtree', { name: selectedMember.displayName })
    : '';

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

  function handleSelect(selection: HierarchyMemberSelection) {
    onChange(selection);
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
        value={displayValue}
        onClick={handleOpen}
        inputProps={{
          'data-testid': 'team-member-select',
          'data-scope': selectedMember ? selectedScope : undefined,
          readOnly: true,
          'aria-label': selectedMember
            ? selectedScope === 'itself'
              ? t('picker.scopeItself', { name: selectedMember.displayName })
              : t('picker.scopeSubtree', { name: selectedMember.displayName })
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
              selectedScope={selectedScope}
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
