import { useMemo, useState, type MouseEvent } from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Box,
  Button,
  Chip,
  ClickAwayListener,
  IconButton,
  List,
  ListItemButton,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material';
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
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedItems.includes(node.id);

  return (
    <>
      <ListItemButton
        selected={selectedUserId === node.id}
        onClick={() => onSelect(node)}
        sx={{ alignItems: 'flex-start', gap: 1, pl: 1 + depth * 2 }}
        aria-label={`Select ${node.displayName}`}
      >
        <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
          {hasChildren ? (
            <IconButton
              size="small"
              edge="start"
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.displayName}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggle(node.id);
              }}
            >
              {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
            </IconButton>
          ) : null}
        </Box>
        <Stack spacing={0.25}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2">{node.displayName}</Typography>
            {node.isLeader ? <Chip size="small" label="Leader" color="error" /> : null}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {node.email}
          </Typography>
        </Stack>
      </ListItemButton>

      {hasChildren && isExpanded ? (
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
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const selectedMember = useMemo(
    () => flattenNodes(reports).find((member) => member.id === selectedUserId) ?? null,
    [reports, selectedUserId],
  );
  const open = Boolean(anchorEl);

  function handleOpen(event: MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
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
    <Box sx={{ minWidth: 280 }}>
      <Typography
        component="label"
        htmlFor="team-member-picker-button"
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 0.5 }}
      >
        Team member
      </Typography>
      <Button
        id="team-member-picker-button"
        variant="outlined"
        color="inherit"
        fullWidth
        disabled={disabled}
        onClick={handleOpen}
        data-testid="team-member-select"
        aria-label={`Team member: ${selectedMember?.displayName ?? 'Select a team member'}`}
        aria-haspopup="dialog"
        aria-expanded={open ? 'true' : undefined}
        sx={{
          height: 56,
          justifyContent: 'space-between',
          px: 1.75,
          textAlign: 'left',
          textTransform: 'none',
        }}
      >
        <Typography
          component="span"
          color={selectedMember ? 'text.primary' : 'text.secondary'}
          noWrap
        >
          {selectedMember?.displayName ?? 'Select a team member'}
        </Typography>
        <ExpandMore fontSize="small" />
      </Button>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={8}
            sx={{
              mt: 1,
              width: anchorEl?.clientWidth ?? 360,
              maxWidth: 420,
              maxHeight: 420,
              overflowY: 'auto',
            }}
          >
            <Box sx={{ p: 1.5, pb: 0.5 }}>
              <Typography variant="subtitle2">Select collaborator</Typography>
              <Typography variant="caption" color="text.secondary">
                Expand leaders to see their reports.
              </Typography>
            </Box>
            <List aria-label="Team member hierarchy" dense sx={{ pb: 1 }}>
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
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
