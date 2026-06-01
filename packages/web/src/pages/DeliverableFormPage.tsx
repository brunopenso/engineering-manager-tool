import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
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
  DeliverablesApiError,
  getDeliverable,
  updateDeliverable,
  type BusinessImpact,
  type DeliverableDetail,
  type DeliverableWriteInput,
} from '../services/deliverablesApi.js';
import { fetchTagCatalog, type Tag } from '../services/tagsApi.js';

const BUSINESS_IMPACTS: BusinessImpact[] = ['LOW', 'MEDIUM', 'HIGH', 'TRANSFORMATIONAL'];

type DeliverableFormMode = 'create' | 'edit';

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

function isDeliverableFormInvalid(form: FormState): boolean {
  return (
    !form.title.trim() ||
    !form.description.trim() ||
    !form.roleInDeliverable.trim() ||
    !form.improvementPoints.trim()
  );
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
    <Stack spacing={2}>
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
      <FormControl>
        <InputLabel id="deliverable-tags-label">Tags</InputLabel>
        <Select
          labelId="deliverable-tags-label"
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
        <FormHelperText>Optional — select catalog tags that apply</FormHelperText>
      </FormControl>
      <FormControl required>
        <InputLabel id="deliverable-business-impact-label">Business impact</InputLabel>
        <Select
          labelId="deliverable-business-impact-label"
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

export default function DeliverableFormPage({ mode }: { mode: DeliverableFormMode }) {
  const { deliverableId } = useParams<{ deliverableId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [tagCatalog, setTagCatalog] = useState<Tag[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Edit deliverable' : 'Add deliverable';
  const saveLabel = isEditMode ? 'Save changes' : 'Save';
  const isSaveDisabled = useMemo(
    () => isDeliverableFormInvalid(form) || isSubmitting || isReadOnly,
    [form, isReadOnly, isSubmitting],
  );

  useEffect(() => {
    async function load() {
      if (!accessToken) {
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        if (isEditMode) {
          if (!deliverableId) {
            setErrorMessage('Unable to load deliverable.');
            return;
          }

          const [tags, result] = await Promise.all([
            fetchTagCatalog(accessToken),
            getDeliverable(accessToken, deliverableId),
          ]);
          setTagCatalog(tags ?? []);
          setForm(formFromDetail(result.deliverable));
          setIsReadOnly(result.readOnly);
        } else {
          const tags = await fetchTagCatalog(accessToken);
          setTagCatalog(tags ?? []);
          setForm(emptyForm());
          setIsReadOnly(false);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof DeliverablesApiError ? error.message : 'Unable to load deliverable form.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [accessToken, deliverableId, isEditMode]);

  async function handleSubmit() {
    if (!accessToken || isSaveDisabled) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEditMode) {
        if (!deliverableId) {
          setErrorMessage('Unable to update deliverable.');
          return;
        }

        await updateDeliverable(accessToken, deliverableId, toWriteInput(form));
      } else {
        await createDeliverable(accessToken, toWriteInput(form));
      }

      navigate('/app/deliverables');
    } catch (error) {
      setErrorMessage(
        error instanceof DeliverablesApiError
          ? error.message
          : isEditMode
            ? 'Unable to update deliverable.'
            : 'Unable to create deliverable.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Deliverables
          </Typography>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          <Typography color="text.secondary">
            Capture the outcome, impact, role, and growth notes in one focused workspace.
          </Typography>
        </Box>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {isReadOnly ? (
          <Alert severity="warning">This deliverable is read-only and cannot be edited.</Alert>
        ) : null}

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          {isLoading ? (
            <Typography>Loading deliverable form...</Typography>
          ) : (
            <Stack spacing={3}>
              <DeliverableFormFields form={form} tagCatalog={tagCatalog} onChange={setForm} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'flex-end' }}>
                <Button onClick={() => navigate('/app/deliverables')}>Cancel</Button>
                <Button variant="contained" disabled={isSaveDisabled} onClick={() => void handleSubmit()}>
                  {isSubmitting ? 'Saving...' : saveLabel}
                </Button>
              </Stack>
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
