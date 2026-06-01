import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import LeaderAssignUsersPanel from '../components/leader-hierarchy/LeaderAssignUsersPanel.js';
import LeaderCreateUserPanel from '../components/leader-hierarchy/LeaderCreateUserPanel.js';
import LeaderHierarchyViewPanel from '../components/leader-hierarchy/LeaderHierarchyViewPanel.js';

export default function LeaderHierarchyManagementPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              Hierarchy management
            </Typography>

            <Tabs
              value={activeTab}
              onChange={(_event, nextTab) => setActiveTab(nextTab)}
              aria-label="Hierarchy management tabs"
            >
              <Tab label="View" />
              <Tab label="Assign users" />
              <Tab label="Create User" />
            </Tabs>

            {activeTab === 0 && <LeaderHierarchyViewPanel />}
            {activeTab === 1 && <LeaderAssignUsersPanel />}
            {activeTab === 2 && <LeaderCreateUserPanel />}
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
