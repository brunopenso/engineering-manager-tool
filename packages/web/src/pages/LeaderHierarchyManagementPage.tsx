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
import { useTranslation } from 'react-i18next';
import LeaderAssignUsersPanel from '../components/leader-hierarchy/LeaderAssignUsersPanel.js';
import LeaderCreateUserPanel from '../components/leader-hierarchy/LeaderCreateUserPanel.js';
import LeaderHierarchyViewPanel from '../components/leader-hierarchy/LeaderHierarchyViewPanel.js';

export default function LeaderHierarchyManagementPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslation('leader');

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              {t('hierarchy.title')}
            </Typography>

            <Tabs
              value={activeTab}
              onChange={(_event, nextTab) => setActiveTab(nextTab)}
              aria-label={t('hierarchy.tabsAria')}
            >
              <Tab label={t('hierarchy.view')} />
              <Tab label={t('hierarchy.assignUsers')} />
              <Tab label={t('hierarchy.createUser')} />
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
