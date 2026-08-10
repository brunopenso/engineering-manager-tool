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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['admin', 'common']);
  const [integrations, setIntegrations] = useState<GithubIntegration[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organizationNameInput, setOrganizationNameInput] = useState('');
  const [disableTarget, setDisableTarget] = useState<GithubIntegration | null>(null);

  const hasIntegrations = integrations.length > 0;
  const isEnableDisabled = useMemo(() => !organizationNameInput.trim(), [organizationNameInput]);

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
        error instanceof GithubIntegrationsApiError ? error.message : t('github.loadError'),
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
      await enableGithubIntegration(accessToken, organizationNameInput);
      setOrganizationNameInput('');
      await refreshIntegrations();
    } catch (error) {
      setErrorMessage(
        error instanceof GithubIntegrationsApiError ? error.message : t('github.enableError'),
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
        error instanceof GithubIntegrationsApiError ? error.message : t('github.disableError'),
      );
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              {t('github.title')}
            </Typography>
            <Typography color="text.secondary">{t('github.subtitle')}</Typography>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Box>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ alignItems: { md: 'center' } }}
              >
                <TextField
                  label={t('github.orgName')}
                  value={organizationNameInput}
                  onChange={(event) => setOrganizationNameInput(event.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={() => void handleEnable()}
                  disabled={isEnableDisabled}
                  sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', md: 'auto' } }}
                >
                  {t('github.enableOrg')}
                </Button>
              </Stack>
              <FormHelperText sx={{ mx: 1.75, mt: 0.5 }}>{t('github.orgHelper')}</FormHelperText>
            </Box>

            {isLoading ? (
              <Typography color="text.secondary">
                {t('loading.organizations', { ns: 'common' })}
              </Typography>
            ) : !hasIntegrations ? (
              <Typography color="text.secondary">{t('github.empty')}</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('github.orgColumn')}</TableCell>
                    <TableCell align="right">{t('actions.actions', { ns: 'common' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>{integration.organizationName}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => setDisableTarget(integration)}
                        >
                          {t('github.disable')}
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
        <DialogTitle>{t('github.disableDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('github.disableDialog.body', {
              organizationName: disableTarget?.organizationName ?? '',
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableTarget(null)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button color="error" variant="contained" onClick={() => void confirmDisable()}>
            {t('github.disable')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
