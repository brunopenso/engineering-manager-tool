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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['deliverables', 'common']);
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
        label={t('fields.title', { ns: 'common' })}
        required
        value={form.title}
        onChange={(event) => onChange({ ...form, title: event.target.value })}
      />
      <TextField
        label={t('form.description')}
        required
        multiline
        minRows={3}
        value={form.description}
        onChange={(event) => onChange({ ...form, description: event.target.value })}
      />
      <TextField
        label={t('form.roleInDeliverable')}
        required
        value={form.roleInDeliverable}
        onChange={(event) => onChange({ ...form, roleInDeliverable: event.target.value })}
      />
      <FormControl>
        <InputLabel id="deliverable-tags-label">{t('fields.tags', { ns: 'common' })}</InputLabel>
        <Select
          labelId="deliverable-tags-label"
          multiple
          label={t('fields.tags', { ns: 'common' })}
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
        <FormHelperText>{t('form.tagsHelper')}</FormHelperText>
      </FormControl>
      <FormControl required>
        <InputLabel id="deliverable-business-impact-label">{t('form.businessImpact')}</InputLabel>
        <Select
          labelId="deliverable-business-impact-label"
          label={t('form.businessImpact')}
          value={form.businessImpact}
          onChange={(event) =>
            onChange({ ...form, businessImpact: event.target.value as BusinessImpact })
          }
        >
          {BUSINESS_IMPACTS.map((impact) => (
            <MenuItem key={impact} value={impact}>
              {t(`impact.${impact}`, { ns: 'common' })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label={t('form.improvementPoints')}
        required
        multiline
        minRows={2}
        value={form.improvementPoints}
        onChange={(event) => onChange({ ...form, improvementPoints: event.target.value })}
      />
      <TextField
        label={t('form.technicalDescription')}
        multiline
        minRows={2}
        value={form.technicalDescription}
        onChange={(event) => onChange({ ...form, technicalDescription: event.target.value })}
      />
      <TextField
        label={t('form.userTags')}
        value={form.userTagsText}
        onChange={(event) => onChange({ ...form, userTagsText: event.target.value })}
      />
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('form.referenceLinks')}
        </Typography>
        <Table size="small" aria-label={t('form.referenceLinksAria')}>
          <TableHead>
            <TableRow>
              <TableCell>{t('fields.url', { ns: 'common' })}</TableCell>
              <TableCell>{t('fields.label', { ns: 'common' })}</TableCell>
              <TableCell align="right">{t('actions.actions', { ns: 'common' })}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {form.links.map((link, index) => (
              <TableRow key={`link-${index}`}>
                <TableCell>
                  <TextField
                    label={t('form.linkUrl', { index: index + 1 })}
                    size="small"
                    fullWidth
                    value={link.url}
                    onChange={(event) => updateLink(index, 'url', event.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    label={t('form.linkLabel', { index: index + 1 })}
                    size="small"
                    fullWidth
                    value={link.label}
                    onChange={(event) => updateLink(index, 'label', event.target.value)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button onClick={() => removeLinkRow(index)}>
                    {t('actions.remove', { ns: 'common' })}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button sx={{ mt: 1 }} onClick={addLinkRow}>
          {t('form.addLink')}
        </Button>
      </Box>
    </Stack>
  );
}

export default function DeliverableFormPage({ mode }: { mode: DeliverableFormMode }) {
  const { deliverableId } = useParams<{ deliverableId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { t } = useTranslation(['deliverables', 'common']);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [tagCatalog, setTagCatalog] = useState<Tag[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const isEditMode = mode === 'edit';
  const title = isEditMode ? t('form.editTitle') : t('form.createTitle');
  const saveLabel = isEditMode ? t('form.saveChanges') : t('actions.save', { ns: 'common' });
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
            setErrorMessage(t('form.loadError'));
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
          error instanceof DeliverablesApiError ? error.message : t('form.formLoadError'),
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
          setErrorMessage(t('form.updateError'));
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
            ? t('form.updateError')
            : t('form.createError'),
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
            {t('form.breadcrumb')}
          </Typography>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          <Typography color="text.secondary">{t('form.subtitle')}</Typography>
        </Box>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {isReadOnly ? <Alert severity="warning">{t('form.readOnly')}</Alert> : null}

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          {isLoading ? (
            <Typography>{t('form.loading')}</Typography>
          ) : (
            <Stack spacing={3}>
              <DeliverableFormFields form={form} tagCatalog={tagCatalog} onChange={setForm} />
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ justifyContent: 'flex-end' }}
              >
                <Button onClick={() => navigate('/app/deliverables')}>
                  {t('actions.cancel', { ns: 'common' })}
                </Button>
                <Button
                  variant="contained"
                  disabled={isSaveDisabled}
                  onClick={() => void handleSubmit()}
                >
                  {isSubmitting ? t('form.saving') : saveLabel}
                </Button>
              </Stack>
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
