import { type ReactNode, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider.js';
import {
  DeliverablesApiError,
  getDeliverable,
  type DeliverableDetail,
} from '../../services/deliverablesApi.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../../types/profilePreferences.js';
import { formatDisplayDateTime } from '../../utils/formatDisplayDate.js';
import DeliverableReviewNotesPanel from './DeliverableReviewNotesPanel.js';

type TeamDeliverableReviewModalProps = {
  open: boolean;
  deliverableId: string | null;
  accessToken: string | null;
  onClose: () => void;
  onReviewedChange?: (deliverableId: string, reviewed: boolean) => void;
};

type DeliverableField = {
  label: string;
  value: ReactNode;
};

function TagFieldValue({
  tags,
  variant,
}: {
  tags: { key: string; label: string; color?: string }[];
  variant: 'filled' | 'outlined';
}) {
  if (tags.length === 0) {
    return <Typography>—</Typography>;
  }

  return (
    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', pt: 0.5 }}>
      {tags.map((tag) => (
        <Chip
          key={tag.key}
          size="small"
          label={tag.label}
          variant={variant}
          sx={
            tag.color
              ? {
                  bgcolor: tag.color,
                  color: '#fff',
                }
              : undefined
          }
        />
      ))}
    </Stack>
  );
}

function DeliverableFieldsPanel({ deliverable }: { deliverable: DeliverableDetail }) {
  const { t } = useTranslation(['leader', 'common']);
  const { user } = useAuth();
  const languagePreference = user?.languagePreference ?? DEFAULT_LANGUAGE_PREFERENCE;
  const dateFormatPreference = user?.dateFormatPreference ?? DEFAULT_DATE_FORMAT_PREFERENCE;

  const fields: DeliverableField[] = [
    { label: t('reviewModal.title'), value: deliverable.title },
    { label: t('reviewModal.description'), value: deliverable.description },
    { label: t('reviewModal.roleInDeliverable'), value: deliverable.roleInDeliverable },
    {
      label: t('reviewModal.businessImpact'),
      value: t(`impact.${deliverable.businessImpact}`, { ns: 'common' }),
    },
    { label: t('reviewModal.improvementPoints'), value: deliverable.improvementPoints },
    {
      label: t('reviewModal.technicalDescription'),
      value: deliverable.technicalDescription ?? '—',
    },
    {
      label: t('systemTags', { ns: 'common' }),
      value: (
        <TagFieldValue
          tags={deliverable.systemTags.map((tag) => ({
            key: tag.id,
            label: tag.name,
            color: tag.color,
          }))}
          variant="filled"
        />
      ),
    },
    {
      label: t('reviewModal.userTags'),
      value: (
        <TagFieldValue
          tags={deliverable.userTags.map((tag, index) => ({
            key: `${tag}-${index}`,
            label: tag,
          }))}
          variant="outlined"
        />
      ),
    },
    {
      label: t('reviewModal.links'),
      value:
        deliverable.links
          .map((link) => (link.label ? `${link.label}: ${link.url}` : link.url))
          .join('\n') || '—',
    },
    {
      label: t('reviewModal.createdAt'),
      value: formatDisplayDateTime(deliverable.createdAt, dateFormatPreference, languagePreference),
    },
    {
      label: t('reviewModal.updatedAt'),
      value: formatDisplayDateTime(deliverable.updatedAt, dateFormatPreference, languagePreference),
    },
  ];

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {fields.map((field) => (
        <Box key={field.label}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
            {field.label}
          </Typography>
          {typeof field.value === 'string' ? (
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{field.value}</Typography>
          ) : (
            field.value
          )}
        </Box>
      ))}
    </Stack>
  );
}

export default function TeamDeliverableReviewModal({
  open,
  deliverableId,
  accessToken,
  onClose,
  onReviewedChange,
}: TeamDeliverableReviewModalProps) {
  const { t } = useTranslation('leader');
  const [activeTab, setActiveTab] = useState(0);
  const [deliverable, setDeliverable] = useState<DeliverableDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setActiveTab(0);
      setDeliverable(null);
      setErrorMessage(null);
      return;
    }

    if (!accessToken || !deliverableId) {
      return;
    }

    let cancelled = false;

    async function loadDeliverable() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await getDeliverable(accessToken!, deliverableId!);
        if (!cancelled) {
          setDeliverable(result.deliverable);
        }
      } catch (error) {
        if (!cancelled) {
          setDeliverable(null);
          setErrorMessage(
            error instanceof DeliverablesApiError
              ? error.message
              : t('reviewModal.loadError'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDeliverable();

    return () => {
      cancelled = true;
    };
  }, [open, accessToken, deliverableId, t]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t('reviewModal.dialogTitle')}</DialogTitle>
      <DialogContent dividers>
        <Tabs
          value={activeTab}
          onChange={(_event, nextTab) => setActiveTab(nextTab)}
          aria-label={t('reviewModal.tabsAria')}
        >
          <Tab label={t('reviewModal.details')} />
          <Tab label={t('reviewModal.notes')} />
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {activeTab === 0 ? (
            isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} aria-label={t('reviewModal.loadingDetails')} />
              </Box>
            ) : errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : deliverable ? (
              <DeliverableFieldsPanel deliverable={deliverable} />
            ) : null
          ) : accessToken && deliverableId ? (
            <DeliverableReviewNotesPanel
              deliverableId={deliverableId}
              accessToken={accessToken}
              active={activeTab === 1}
              onReviewedChange={onReviewedChange}
            />
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('reviewModal.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
