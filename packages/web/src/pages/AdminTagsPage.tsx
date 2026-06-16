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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.js';
import {
  createTag,
  deleteTag,
  listTags,
  TagsApiError,
  updateTag,
  type Tag,
} from '../services/tagsApi.js';

type EditState = {
  name: string;
  color: string;
};

export default function AdminTagsPage() {
  const { accessToken } = useAuth();
  const { t } = useTranslation(['admin', 'common']);
  const [tags, setTags] = useState<Tag[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#1976D2');
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [editById, setEditById] = useState<Record<string, EditState>>({});

  const hasTags = tags.length > 0;

  async function refreshTags() {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listTags(accessToken);
      setTags(response);
      setEditById(
        Object.fromEntries(
          response.map((tag) => [
            tag.id,
            {
              name: tag.name,
              color: tag.color,
            },
          ]),
        ),
      );
    } catch (error) {
      setErrorMessage(error instanceof TagsApiError ? error.message : t('tags.loadError'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshTags();
  }, [accessToken]);

  const isCreateDisabled = useMemo(() => !newName.trim() || !newColor.trim(), [newName, newColor]);

  async function handleCreate() {
    if (!accessToken || isCreateDisabled) {
      return;
    }

    setErrorMessage(null);

    try {
      await createTag(accessToken, { name: newName, color: newColor });
      setNewName('');
      setNewColor('#1976D2');
      await refreshTags();
    } catch (error) {
      setErrorMessage(error instanceof TagsApiError ? error.message : t('tags.createError'));
    }
  }

  async function handleSave(tagId: string) {
    if (!accessToken) {
      return;
    }

    const edit = editById[tagId];
    if (!edit) {
      return;
    }

    setErrorMessage(null);

    try {
      await updateTag(accessToken, tagId, {
        name: edit.name,
        color: edit.color,
      });
      await refreshTags();
    } catch (error) {
      setErrorMessage(error instanceof TagsApiError ? error.message : t('tags.updateError'));
    }
  }

  async function confirmDelete() {
    if (!accessToken || !deleteTarget) {
      return;
    }

    setErrorMessage(null);

    try {
      await deleteTag(accessToken, deleteTarget.id);
      setDeleteTarget(null);
      await refreshTags();
    } catch (error) {
      setErrorMessage(error instanceof TagsApiError ? error.message : t('tags.deleteError'));
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              {t('tags.title')}
            </Typography>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ alignItems: { md: 'end' } }}
            >
              <TextField
                label={t('tags.tagName')}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                fullWidth
              />
              <TextField
                label={t('tags.tagColor')}
                type="color"
                value={newColor}
                onChange={(event) => setNewColor(event.target.value)}
                sx={{ minWidth: 140 }}
              />
              <Button variant="contained" onClick={() => void handleCreate()} disabled={isCreateDisabled}>
                {t('tags.createTag')}
              </Button>
            </Stack>

            {isLoading ? (
              <Typography color="text.secondary">{t('loading.tags', { ns: 'common' })}</Typography>
            ) : !hasTags ? (
              <Typography color="text.secondary">{t('tags.empty')}</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('fields.name', { ns: 'common' })}</TableCell>
                    <TableCell>{t('fields.color', { ns: 'common' })}</TableCell>
                    <TableCell align="right">{t('actions.actions', { ns: 'common' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tags.map((tag) => {
                    const edit = editById[tag.id] ?? { name: tag.name, color: tag.color };
                    return (
                      <TableRow key={tag.id}>
                        <TableCell sx={{ width: '45%' }}>
                          <TextField
                            value={edit.name}
                            onChange={(event) =>
                              setEditById((current) => ({
                                ...current,
                                [tag.id]: { ...edit, name: event.target.value },
                              }))
                            }
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell sx={{ width: '25%' }}>
                          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                            <TextField
                              type="color"
                              value={edit.color}
                              onChange={(event) =>
                                setEditById((current) => ({
                                  ...current,
                                  [tag.id]: { ...edit, color: event.target.value },
                                }))
                              }
                              size="small"
                              sx={{ width: 70 }}
                            />
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: edit.color,
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            <Button size="small" variant="outlined" onClick={() => void handleSave(tag.id)}>
                              {t('actions.save', { ns: 'common' })}
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => setDeleteTarget(tag)}
                            >
                              {t('actions.delete', { ns: 'common' })}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Stack>
        </Paper>
      </Box>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{t('tags.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('tags.deleteDialog.body', { name: deleteTarget?.name ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button color="error" variant="contained" onClick={() => void confirmDelete()}>
            {t('actions.delete', { ns: 'common' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
