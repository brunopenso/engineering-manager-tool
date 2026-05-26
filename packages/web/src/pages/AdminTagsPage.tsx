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
      setErrorMessage(error instanceof TagsApiError ? error.message : 'Unable to load tags.');
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
      setErrorMessage(error instanceof TagsApiError ? error.message : 'Unable to create tag.');
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
      setErrorMessage(error instanceof TagsApiError ? error.message : 'Unable to update tag.');
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
      setErrorMessage(error instanceof TagsApiError ? error.message : 'Unable to delete tag.');
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              Tag management
            </Typography>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ alignItems: { md: 'end' } }}
            >
              <TextField
                label="Tag name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                fullWidth
              />
              <TextField
                label="Tag color"
                type="color"
                value={newColor}
                onChange={(event) => setNewColor(event.target.value)}
                sx={{ minWidth: 140 }}
              />
              <Button variant="contained" onClick={() => void handleCreate()} disabled={isCreateDisabled}>
                Create tag
              </Button>
            </Stack>

            {isLoading ? (
              <Typography color="text.secondary">Loading tags...</Typography>
            ) : !hasTags ? (
              <Typography color="text.secondary">
                No tags yet. Create your first tag to start the catalog.
              </Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell align="right">Actions</TableCell>
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
                              Save
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => setDeleteTarget(tag)}
                            >
                              Delete
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
        <DialogTitle>Delete tag</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the tag &quot;{deleteTarget?.name}&quot;?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
