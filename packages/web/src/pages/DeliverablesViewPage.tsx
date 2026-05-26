import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Chip,
  Container,
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
  DeliverablesApiError,
  listUserDeliverables,
  type DeliverableSummary,
} from '../services/deliverablesApi.js';

export default function DeliverablesViewPage() {
  const { userId } = useParams<{ userId: string }>();
  const { accessToken } = useAuth();
  const [deliverables, setDeliverables] = useState<DeliverableSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!accessToken || !userId) {
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await listUserDeliverables(accessToken, userId);
        setDeliverables(result.deliverables);
      } catch (error) {
        setErrorMessage(
          error instanceof DeliverablesApiError
            ? error.message
            : 'Unable to load deliverables for this collaborator.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [accessToken, userId]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Team member deliverables
          </Typography>
          <Typography color="text.secondary">
            Read-only view for coaching and performance conversations.
          </Typography>
        </Box>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Paper variant="outlined">
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              <Typography>Loading deliverables…</Typography>
            </Box>
          ) : deliverables.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">No deliverables to display.</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>System tags</TableCell>
                  <TableCell>Updated</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
