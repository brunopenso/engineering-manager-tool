import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  DeliverableReviewNotesApiError,
  getReviewNotes,
  saveReviewNotes,
} from '../../services/deliverableReviewNotesApi.js';

const MAX_NOTES_LENGTH = 8000;

type DeliverableReviewNotesPanelProps = {
  deliverableId: string;
  accessToken: string;
  active: boolean;
  onReviewedChange?: (deliverableId: string, reviewed: boolean) => void;
};

export default function DeliverableReviewNotesPanel({
  deliverableId,
  accessToken,
  active,
  onReviewedChange,
}: DeliverableReviewNotesPanelProps) {
  const { t } = useTranslation('leader');
  const [notes, setNotes] = useState('');
  const [loadedNotes, setLoadedNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await getReviewNotes(accessToken, deliverableId);
      const nextNotes = result.notes ?? '';
      setNotes(nextNotes);
      setLoadedNotes(nextNotes);
    } catch (error) {
      setLoadError(
        error instanceof DeliverableReviewNotesApiError
          ? error.message
          : t('reviewNotes.loadError'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, deliverableId, t]);

  useEffect(() => {
    if (!active) {
      return;
    }

    void loadNotes();
  }, [active, loadNotes]);

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const result = await saveReviewNotes(accessToken, deliverableId, notes);
      const nextNotes = result.notes ?? '';
      setNotes(nextNotes);
      setLoadedNotes(nextNotes);
      setSaveSuccess(true);

      if (result.reviewed) {
        onReviewedChange?.(deliverableId, true);
      }
    } catch (error) {
      setSaveError(
        error instanceof DeliverableReviewNotesApiError
          ? error.message
          : t('reviewNotes.saveError'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} aria-label={t('reviewNotes.loading')} />
      </Box>
    );
  }

  const showEmptyGuidance = loadedNotes.length === 0 && notes.length === 0;

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {loadError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void loadNotes()}>
              {t('reviewNotes.retry')}
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : null}

      {showEmptyGuidance ? (
        <Typography color="text.secondary" variant="body2">
          {t('reviewNotes.emptyGuidance')}
        </Typography>
      ) : null}

      <TextField
        label={t('reviewNotes.label')}
        multiline
        minRows={6}
        fullWidth
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setSaveSuccess(false);
        }}
        slotProps={{
          htmlInput: {
            maxLength: MAX_NOTES_LENGTH,
            'data-testid': 'review-notes-input',
          },
        }}
        helperText={t('reviewNotes.characterCount', {
          count: notes.length,
          max: MAX_NOTES_LENGTH,
        })}
        disabled={isSaving}
      />

      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      {saveSuccess ? <Alert severity="success">{t('reviewNotes.saved')}</Alert> : null}

      <Box>
        <Button variant="contained" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? t('reviewNotes.saving') : t('reviewNotes.save')}
        </Button>
      </Box>
    </Stack>
  );
}
