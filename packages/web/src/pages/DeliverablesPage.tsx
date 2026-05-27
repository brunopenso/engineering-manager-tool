import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthProvider.js';
import {
  deleteDeliverable,
  DeliverablesApiError,
  listMyDeliverables,
  type DeliverableSummary,
} from '../services/deliverablesApi.js';

export default function DeliverablesPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [deliverables, setDeliverables] = useState<DeliverableSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeliverableSummary | null>(null);

  const hasDeliverables = deliverables.length > 0;

  async function refreshData() {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const items = await listMyDeliverables(accessToken);
      setDeliverables(items ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof DeliverablesApiError ? error.message : 'Unable to load deliverables.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, [accessToken]);

  async function handleDelete() {
    if (!accessToken || !deleteTarget) {
      return;
    }

    setErrorMessage(null);

    try {
      await deleteDeliverable(accessToken, deleteTarget.id);
      setDeleteTarget(null);
      await refreshData();
    } catch (error) {
      setErrorMessage(
        error instanceof DeliverablesApiError ? error.message : 'Unable to delete deliverable.',
      );
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Deliverables
          </Typography>
          <Typography color="text.secondary">
            Capture your work outcomes, impact, and growth areas for performance conversations.
          </Typography>
        </Box>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Box>
          <Button variant="contained" onClick={() => navigate('/app/deliverables/new')}>
            Add deliverable
          </Button>
        </Box>

        <Paper variant="outlined">
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              <Typography>Loading deliverables…</Typography>
            </Box>
          ) : !hasDeliverables ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                No deliverables yet
              </Typography>
              <Typography color="text.secondary">
                Add your first deliverable to start building your portfolio.
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliverables.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.businessImpact}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        {item.systemTags.map((tag) => (
                          <Chip
                            key={tag.id}
                            size="small"
                            label={tag.name}
                            sx={{ bgcolor: tag.color, color: '#fff' }}
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          onClick={() => navigate(`/app/deliverables/${item.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button size="small" color="error" onClick={() => setDeleteTarget(item)}>
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Stack>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete deliverable?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove &quot;{deleteTarget?.title}&quot; from your portfolio.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
