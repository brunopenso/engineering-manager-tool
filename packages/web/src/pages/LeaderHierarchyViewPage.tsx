import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthProvider.js';
import { isLeader } from '../auth/roleGuards.js';
import HierarchyTree from '../components/hierarchy/HierarchyTree.js';
import {
  fetchLeaderHierarchyView,
  type LeaderHierarchyViewResponse,
  UsersApiError,
} from '../services/usersApi.js';

export default function LeaderHierarchyViewPage() {
  const { accessToken, user } = useAuth();
  const [hierarchy, setHierarchy] = useState<LeaderHierarchyViewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !isLeader(user)) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadHierarchy() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await fetchLeaderHierarchyView(accessToken!);
        if (!cancelled) {
          setHierarchy(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof UsersApiError
              ? error.message
              : 'Unable to load hierarchy view.';
          setErrorMessage(message);
          setHierarchy(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHierarchy();

    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  if (!isLeader(user)) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Hierarchy view
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Read-only view of your reporting line and team structure.
          </Typography>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress aria-label="Loading hierarchy" />
          </Box>
        )}

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {!isLoading && hierarchy && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={3}>
              {hierarchy.manager && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Your manager
                  </Typography>
                  <Typography variant="body1">{hierarchy.manager.displayName}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Your team
                </Typography>
                <HierarchyTree self={hierarchy.self} reports={hierarchy.reports} />
              </Box>
            </Stack>
          </Paper>
        )}

        {!isLoading && hierarchy && hierarchy.reports.length === 0 && !hierarchy.manager && (
          <Alert severity="info">You have no manager assigned and no direct reports yet.</Alert>
        )}
      </Stack>
    </Container>
  );
}
