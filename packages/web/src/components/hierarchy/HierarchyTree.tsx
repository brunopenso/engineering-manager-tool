import { useState } from 'react';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Box, Chip, Collapse, List, ListItemButton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { HierarchyViewNode } from '../../services/usersApi.js';
import HierarchyRoleChips from './HierarchyRoleChips.js';

type HierarchyTreeProps = {
  self: HierarchyViewNode;
  reports: HierarchyViewNode[];
};

type HierarchyNodeProps = {
  node: HierarchyViewNode;
  depth: number;
  expandedItems: string[];
  onToggle: (nodeId: string) => void;
};

function HierarchyNode({ node, depth, expandedItems, onToggle }: HierarchyNodeProps) {
  const { t } = useTranslation('leader');
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedItems.includes(node.id);
  const isCollaboratorOnly = !node.isLeader;

  return (
    <>
      <ListItemButton
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id);
          }
        }}
        sx={{
          pl: 2 + depth * 2,
          ...(isCollaboratorOnly &&
            !hasChildren && {
              '&.Mui-disabled': { opacity: 1 },
              '&.Mui-disabled .MuiTypography-root': { color: 'text.primary' },
            }),
        }}
        disabled={!hasChildren}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        <Box sx={{ width: 28, display: 'flex', alignItems: 'center' }}>
          {hasChildren ? (
            isExpanded ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            component="span"
            variant="body2"
            sx={{
              fontWeight: node.isCurrentPosition ? 700 : 400,
              ...(isCollaboratorOnly ? { color: 'text.primary' } : {}),
            }}
          >
            {node.displayName}
          </Typography>
          {node.isCurrentPosition && (
            <Chip
              size="small"
              label={t('hierarchy.you')}
              color="primary"
              data-testid="current-position-marker"
            />
          )}
          <HierarchyRoleChips isLeader={node.isLeader} />
        </Box>
      </ListItemButton>
      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {children.map((child) => (
              <HierarchyNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedItems={expandedItems}
                onToggle={onToggle}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

export default function HierarchyTree({ self, reports }: HierarchyTreeProps) {
  const { t } = useTranslation('leader');
  const [expandedItems, setExpandedItems] = useState<string[]>([self.id]);

  function handleToggle(nodeId: string) {
    setExpandedItems((current) =>
      current.includes(nodeId) ? current.filter((id) => id !== nodeId) : [...current, nodeId],
    );
  }

  const selfNode: HierarchyViewNode = { ...self, isCurrentPosition: true, children: reports };

  return (
    <List aria-label={t('hierarchy.reportingHierarchyAria')} data-testid="hierarchy-tree">
      <HierarchyNode
        node={selfNode}
        depth={0}
        expandedItems={expandedItems}
        onToggle={handleToggle}
      />
    </List>
  );
}
