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
          : 'Unable to load review notes.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, deliverableId]);

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
          : 'Unable to save review notes.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} aria-label="Loading review notes" />
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
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : null}

      {showEmptyGuidance ? (
        <Typography color="text.secondary" variant="body2">
          Add private coaching notes for this deliverable. Only you can see notes you save here.
        </Typography>
      ) : null}

      <TextField
        label="Review notes"
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
        helperText={`${notes.length}/${MAX_NOTES_LENGTH} characters`}
        disabled={isSaving}
      />

      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      {saveSuccess ? <Alert severity="success">Review notes saved.</Alert> : null}

      <Box>
        <Button variant="contained" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save notes'}
        </Button>
      </Box>
    </Stack>
  );
}
