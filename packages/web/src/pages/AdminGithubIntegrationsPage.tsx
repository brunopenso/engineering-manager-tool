import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
  TextField,
  Typography,
  FormHelperText,
} from '@mui/material';
import { useAuth } from '../auth/AuthProvider.js';
import {
  disableGithubIntegration,
  enableGithubIntegration,
  GithubIntegrationsApiError,
  listGithubIntegrations,
  type GithubIntegration,
} from '../services/githubIntegrationsApi.js';

export default function AdminGithubIntegrationsPage() {
  const { accessToken } = useAuth();
  const [integrations, setIntegrations] = useState<GithubIntegration[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginInput, setLoginInput] = useState('');
  const [disableTarget, setDisableTarget] = useState<GithubIntegration | null>(null);

  const hasIntegrations = integrations.length > 0;
  const isEnableDisabled = useMemo(() => !loginInput.trim(), [loginInput]);

  async function refreshIntegrations() {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listGithubIntegrations(accessToken);
      setIntegrations(response);
    } catch (error) {
      setErrorMessage(
        error instanceof GithubIntegrationsApiError
          ? error.message
          : 'Unable to load GitHub integrations.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshIntegrations();
  }, [accessToken]);

  async function handleEnable() {
    if (!accessToken || isEnableDisabled) {
      return;
    }

    setErrorMessage(null);

    try {
      await enableGithubIntegration(accessToken, loginInput);
      setLoginInput('');
      await refreshIntegrations();
    } catch (error) {
      setErrorMessage(
        error instanceof GithubIntegrationsApiError
          ? error.message
          : 'Unable to enable GitHub organization.',
      );
    }
  }

  async function confirmDisable() {
    if (!accessToken || !disableTarget) {
      return;
    }

    setErrorMessage(null);

    try {
      await disableGithubIntegration(accessToken, disableTarget.id);
      setDisableTarget(null);
      await refreshIntegrations();
    } catch (error) {
      setErrorMessage(
        error instanceof GithubIntegrationsApiError
          ? error.message
          : 'Unable to disable GitHub organization.',
      );
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              GitHub integration
            </Typography>
            <Typography color="text.secondary">
              Manage which GitHub organizations are enabled for product integrations.
            </Typography>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Box>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ alignItems: { md: 'center' } }}
              >
                <TextField
                  label="Organization login"
                  value={loginInput}
                  onChange={(event) => setLoginInput(event.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={() => void handleEnable()}
                  disabled={isEnableDisabled}
                  sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', md: 'auto' } }}
                >
                  Enable organization
                </Button>
              </Stack>
              <FormHelperText sx={{ mx: 1.75, mt: 0.5 }}>
                GitHub organization slug (for example acme-corp), not a full URL.
              </FormHelperText>
            </Box>

            {isLoading ? (
              <Typography color="text.secondary">Loading organizations...</Typography>
            ) : !hasIntegrations ? (
              <Typography color="text.secondary">
                No GitHub organizations enabled yet. Add the first organization login above to
                enable integration scope.
              </Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Organization login</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>{integration.login}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => setDisableTarget(integration)}
                        >
                          Disable
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Stack>
        </Paper>
      </Box>

      <Dialog open={Boolean(disableTarget)} onClose={() => setDisableTarget(null)}>
        <DialogTitle>Disable organization</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disable &quot;{disableTarget?.login}&quot;? It will no longer
            be part of the enabled integration scope.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDisable()}>
            Disable
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
