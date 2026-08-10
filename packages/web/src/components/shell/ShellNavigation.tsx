import { NavLink } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Box,
  Divider,
} from '@mui/material';
import type { ShellMenuOption, ShellMenuSection } from '../../routes/shellOptions.js';

type ShellNavigationProps = {
  sections: ShellMenuSection[];
  onOptionSelected: () => void;
};

function getExactMatchRoutes(sections: ShellMenuSection[]): Set<string> {
  const routes = sections.flatMap((section) => section.options.map((option) => option.route));
  const exactMatchRoutes = new Set<string>();

  for (const route of routes) {
    const hasMoreSpecificMenuRoute = routes.some(
      (other) => other !== route && other.startsWith(`${route}/`),
    );
    if (hasMoreSpecificMenuRoute) {
      exactMatchRoutes.add(route);
    }
  }

  return exactMatchRoutes;
}

type ShellNavItemProps = {
  option: ShellMenuOption;
  matchEnd: boolean;
  onOptionSelected: () => void;
};

function ShellNavItem({ option, matchEnd, onOptionSelected }: ShellNavItemProps) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        component={NavLink}
        to={option.route}
        end={matchEnd}
        onClick={onOptionSelected}
        disabled={!option.available}
        sx={{
          '&.active': {
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: 'action.selected',
            },
          },
        }}
      >
        <ListItemText primary={option.label} />
      </ListItemButton>
    </ListItem>
  );
}

export default function ShellNavigation({ sections, onOptionSelected }: ShellNavigationProps) {
  const exactMatchRoutes = getExactMatchRoutes(sections);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Divider />
      <nav aria-label="App navigation" style={{ flex: 1 }}>
        <List disablePadding>
          {sections.map((section, sectionIndex) => (
            <Box key={section.id}>
              {sectionIndex > 0 && <Divider />}
              {section.title ? (
                <Box role="group" aria-label={section.title}>
                  <ListSubheader disableSticky>{section.title}</ListSubheader>
                  {section.options.map((option) => (
                    <ShellNavItem
                      key={option.id}
                      option={option}
                      matchEnd={exactMatchRoutes.has(option.route)}
                      onOptionSelected={onOptionSelected}
                    />
                  ))}
                </Box>
              ) : (
                section.options.map((option) => (
                  <ShellNavItem
                    key={option.id}
                    option={option}
                    matchEnd={exactMatchRoutes.has(option.route)}
                    onOptionSelected={onOptionSelected}
                  />
                ))
              )}
            </Box>
          ))}
        </List>
      </nav>
    </Box>
  );
}
