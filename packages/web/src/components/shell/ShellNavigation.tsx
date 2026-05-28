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
import type { ShellMenuSection } from '../../routes/shellOptions.js';

type ShellNavigationProps = {
  sections: ShellMenuSection[];
  onOptionSelected: () => void;
};

export default function ShellNavigation({
  sections,
  onOptionSelected,
}: ShellNavigationProps) {
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
                    <ListItem key={option.id} disablePadding>
                      <ListItemButton
                        component={NavLink}
                        to={option.route}
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
                  ))}
                </Box>
              ) : (
                section.options.map((option) => (
                  <ListItem key={option.id} disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to={option.route}
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
                ))
              )}
            </Box>
          ))}
        </List>
      </nav>
    </Box>
  );
}
