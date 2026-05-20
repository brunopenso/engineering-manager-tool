import { NavLink } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Divider,
} from '@mui/material';
import type { ShellMenuOption } from '../../routes/shellOptions.js';

type ShellNavigationProps = {
  options: ShellMenuOption[];
  onOptionSelected: () => void;
};

export default function ShellNavigation({
  options,
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
          {options.map((option, index) => (
            <Box key={option.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
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
            </Box>
          ))}
        </List>
      </nav>
    </Box>
  );
}
