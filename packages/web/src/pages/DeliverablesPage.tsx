import { useEffect, useMemo, useState } from 'react';
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
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  createDeliverable,
  deleteDeliverable,
  DeliverablesApiError,
  getDeliverable,
  listMyDeliverables,
  updateDeliverable,
  type BusinessImpact,
  type DeliverableDetail,
  type DeliverableSummary,
  type DeliverableWriteInput,
} from '../services/deliverablesApi.js';
import { fetchTagCatalog, type Tag } from '../services/tagsApi.js';

const BUSINESS_IMPACTS: BusinessImpact[] = ['LOW', 'MEDIUM', 'HIGH', 'TRANSFORMATIONAL'];

type FormState = {
  title: string;
  description: string;
  roleInDeliverable: string;
  systemTagIds: string[];
  businessImpact: BusinessImpact;
  improvementPoints: string;
  technicalDescription: string;
  userTagsText: string;
  links: { url: string; label: string }[];
};

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  roleInDeliverable: '',
  systemTagIds: [],
  businessImpact: 'MEDIUM',
  improvementPoints: '',
  technicalDescription: '',
  userTagsText: '',
  links: [],
});

function parseUserTags(text: string): string[] {
  return text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseLinks(rows: { url: string; label: string }[]): { url: string; label?: string }[] {
  return rows
    .map((row) => ({
      url: row.url.trim(),
      label: row.label.trim(),
    }))
    .filter((row) => row.url.length > 0)
    .map((row) => ({ url: row.url, label: row.label || undefined }));
}

function formFromDetail(detail: DeliverableDetail): FormState {
  return {
    title: detail.title,
    description: detail.description,
    roleInDeliverable: detail.roleInDeliverable,
    systemTagIds: detail.systemTags.map((tag) => tag.id),
    businessImpact: detail.businessImpact,
    improvementPoints: detail.improvementPoints,
    technicalDescription: detail.technicalDescription ?? '',
    userTagsText: detail.userTags.join(', '),
    links: detail.links.map((link) => ({ url: link.url, label: link.label ?? '' })),
  };
}

function toWriteInput(form: FormState): DeliverableWriteInput & {
  userTags: string[];
  links: { url: string; label?: string | null }[];
} {
  return {
    title: form.title,
    description: form.description,
    roleInDeliverable: form.roleInDeliverable,
    systemTagIds: form.systemTagIds,
    businessImpact: form.businessImpact,
    improvementPoints: form.improvementPoints,
    technicalDescription: form.technicalDescription || null,
    userTags: parseUserTags(form.userTagsText),
    links: parseLinks(form.links),
  };
}

function DeliverableFormFields({
  form,
  tagCatalog,
  onChange,
}: {
  form: FormState;
  tagCatalog: Tag[];
  onChange: (next: FormState) => void;
}) {
  const updateLink = (index: number, field: 'url' | 'label', value: string) => {
    const nextLinks = form.links.map((link, linkIndex) =>
      linkIndex === index ? { ...link, [field]: value } : link,
    );
    onChange({ ...form, links: nextLinks });
  };

  const addLinkRow = () => {
    onChange({ ...form, links: [...form.links, { url: '', label: '' }] });
  };

  const removeLinkRow = (index: number) => {
    onChange({ ...form, links: form.links.filter((_, linkIndex) => linkIndex !== index) });
  };

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <TextField
        label="Title"
        required
        value={form.title}
        onChange={(event) => onChange({ ...form, title: event.target.value })}
      />
      <TextField
        label="Description"
        required
        multiline
        minRows={3}
        value={form.description}
        onChange={(event) => onChange({ ...form, description: event.target.value })}
      />
      <TextField
        label="Your role in this deliverable"
        required
        value={form.roleInDeliverable}
        onChange={(event) => onChange({ ...form, roleInDeliverable: event.target.value })}
      />
      <FormControl required>
        <InputLabel id="tags-label">Tags</InputLabel>
        <Select
          labelId="tags-label"
          multiple
          label="Tags"
          value={form.systemTagIds}
          onChange={(event) =>
            onChange({
              ...form,
              systemTagIds: event.target.value as string[],
            })
          }
          renderValue={(selected) => {
            const selectedIds = selected as string[];
            return selectedIds
              .map((tagId) => tagCatalog.find((tag) => tag.id === tagId)?.name ?? tagId)
              .join(', ');
          }}
        >
          {tagCatalog.map((tag) => (
            <MenuItem key={tag.id} value={tag.id}>
              {tag.name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Select at least one catalog tag</FormHelperText>
      </FormControl>
      <FormControl required>
        <InputLabel id="business-impact-label">Business impact</InputLabel>
        <Select
          labelId="business-impact-label"
          label="Business impact"
          value={form.businessImpact}
          onChange={(event) =>
            onChange({ ...form, businessImpact: event.target.value as BusinessImpact })
          }
        >
          {BUSINESS_IMPACTS.map((impact) => (
            <MenuItem key={impact} value={impact}>
              {impact}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Personal performance improvement points"
        required
        multiline
        minRows={2}
        value={form.improvementPoints}
        onChange={(event) => onChange({ ...form, improvementPoints: event.target.value })}
      />
      <TextField
        label="Technical description (optional)"
        multiline
        minRows={2}
        value={form.technicalDescription}
        onChange={(event) => onChange({ ...form, technicalDescription: event.target.value })}
      />
      <TextField
        label="User tags (optional, comma-separated)"
        value={form.userTagsText}
        onChange={(event) => onChange({ ...form, userTagsText: event.target.value })}
      />
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Reference links (optional)
        </Typography>
        <Table size="small" aria-label="Reference links table">
          <TableHead>
            <TableRow>
              <TableCell>URL</TableCell>
              <TableCell>Label</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {form.links.map((link, index) => (
              <TableRow key={`link-${index}`}>
                <TableCell>
                  <TextField
                    label={`Link URL ${index + 1}`}
                    size="small"
                    fullWidth
                    value={link.url}
                    onChange={(event) => updateLink(index, 'url', event.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    label={`Link label ${index + 1}`}
                    size="small"
                    fullWidth
                    value={link.label}
                    onChange={(event) => updateLink(index, 'label', event.target.value)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button onClick={() => removeLinkRow(index)}>Remove</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button sx={{ mt: 1 }} onClick={addLinkRow}>
          Add link
        </Button>
      </Box>
    </Stack>
  );
}

export default function DeliverablesPage() {
  const { accessToken } = useAuth();
  const [deliverables, setDeliverables] = useState<DeliverableSummary[]>([]);
  const [tagCatalog, setTagCatalog] = useState<Tag[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [editTarget, setEditTarget] = useState<DeliverableSummary | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<DeliverableSummary | null>(null);

  const hasDeliverables = deliverables.length > 0;
  const isCreateDisabled = useMemo(
    () =>
      !createForm.title.trim() ||
      !createForm.description.trim() ||
      !createForm.roleInDeliverable.trim() ||
      createForm.systemTagIds.length === 0 ||
      !createForm.improvementPoints.trim(),
    [createForm],
  );

  async function refreshData() {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [items, tags] = await Promise.all([
        listMyDeliverables(accessToken),
        fetchTagCatalog(accessToken),
      ]);
      setDeliverables(items ?? []);
      setTagCatalog(tags ?? []);
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

  async function handleCreate() {
    if (!accessToken || isCreateDisabled) {
      return;
    }

    setErrorMessage(null);

    try {
      await createDeliverable(accessToken, toWriteInput(createForm));
      setCreateOpen(false);
      setCreateForm(emptyForm());
      await refreshData();
    } catch (error) {
      setErrorMessage(
        error instanceof DeliverablesApiError ? error.message : 'Unable to create deliverable.',
      );
    }
  }

  async function openEdit(target: DeliverableSummary) {
    if (!accessToken) {
      return;
    }

    setErrorMessage(null);

    try {
      const { deliverable } = await getDeliverable(accessToken, target.id);
      setEditTarget(target);
      setEditForm(formFromDetail(deliverable));
    } catch (error) {
      setErrorMessage(
        error instanceof DeliverablesApiError ? error.message : 'Unable to load deliverable.',
      );
    }
  }

  async function handleUpdate() {
    if (!accessToken || !editTarget) {
      return;
    }

    setErrorMessage(null);

    try {
      await updateDeliverable(accessToken, editTarget.id, toWriteInput(editForm));
      setEditTarget(null);
      await refreshData();
    } catch (error) {
      setErrorMessage(
        error instanceof DeliverablesApiError ? error.message : 'Unable to update deliverable.',
      );
    }
  }

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
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
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
                        <Button size="small" onClick={() => void openEdit(item)}>
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

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Add deliverable</DialogTitle>
        <DialogContent>
          <DeliverableFormFields form={createForm} tagCatalog={tagCatalog} onChange={setCreateForm} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={isCreateDisabled} onClick={() => void handleCreate()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} fullWidth maxWidth="md">
        <DialogTitle>Edit deliverable</DialogTitle>
        <DialogContent>
          <DeliverableFormFields form={editForm} tagCatalog={tagCatalog} onChange={setEditForm} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleUpdate()}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>

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
