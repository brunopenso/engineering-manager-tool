import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchClassificationTypes,
  MyPullRequestsApiError,
  reclassifyPullRequests,
  type PullRequestClassificationType,
} from '../../services/myPullRequestsApi.js';

type ChangeClassificationModalProps = {
  open: boolean;
  accessToken: string;
  selectedCount: number;
  pullRequestIds: string[];
  onClose: () => void;
  onSaved: (
    updates: Array<{ id: string; userReclassification: PullRequestClassificationType }>,
  ) => void;
};

export default function ChangeClassificationModal({
  open,
  accessToken,
  selectedCount,
  pullRequestIds,
  onClose,
  onSaved,
}: ChangeClassificationModalProps) {
  const { t } = useTranslation('prActivity');
  const [types, setTypes] = useState<PullRequestClassificationType[]>([]);
  const [classification, setClassification] = useState<PullRequestClassificationType | ''>('');
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setClassification('');
    setErrorMessage(null);
    setIsLoadingOptions(true);

    void (async () => {
      try {
        const response = await fetchClassificationTypes(accessToken);
        if (!cancelled) {
          setTypes(response.types);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof MyPullRequestsApiError
              ? error.message
              : t('reclassify.loadOptionsError'),
          );
          setTypes([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOptions(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, accessToken, t]);

  const handleConfirm = async () => {
    if (!classification) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await reclassifyPullRequests(accessToken, {
        pullRequestIds,
        classification,
      });
      onSaved(
        response.pullRequests.map((pr) => ({
          id: pr.id,
          userReclassification: classification,
        })),
      );
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof MyPullRequestsApiError ? error.message : t('reclassify.saveError'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      data-testid="change-classification-modal"
    >
      <DialogTitle>{t('reclassify.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography>{t('reclassify.confirmBody', { count: selectedCount })}</Typography>

          {isLoadingOptions ? (
            <CircularProgress size={28} aria-label={t('reclassify.loadingOptions')} />
          ) : (
            <FormControl fullWidth disabled={isSaving || types.length === 0}>
              <InputLabel id="reclassify-type-label">{t('reclassify.classificationLabel')}</InputLabel>
              <Select
                labelId="reclassify-type-label"
                label={t('reclassify.classificationLabel')}
                value={classification}
                onChange={(event) =>
                  setClassification(event.target.value as PullRequestClassificationType | '')
                }
                data-testid="reclassify-type-select"
              >
                {types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`classification.${type}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          {t('reclassify.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleConfirm()}
          disabled={isSaving || isLoadingOptions || !classification}
          data-testid="reclassify-confirm"
        >
          {isSaving ? t('reclassify.saving') : t('reclassify.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
