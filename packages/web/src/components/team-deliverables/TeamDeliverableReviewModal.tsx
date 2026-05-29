import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
import {
  DeliverablesApiError,
  getDeliverable,
  type DeliverableDetail,
} from '../../services/deliverablesApi.js';

type TeamDeliverableReviewModalProps = {
  open: boolean;
  deliverableId: string | null;
  accessToken: string | null;
  onClose: () => void;
};

function DeliverableFieldsPanel({ deliverable }: { deliverable: DeliverableDetail }) {
  const fields: { label: string; value: string }[] = [
    { label: 'Title', value: deliverable.title },
    { label: 'Description', value: deliverable.description },
    { label: 'Role in deliverable', value: deliverable.roleInDeliverable },
    { label: 'Business impact', value: deliverable.businessImpact },
    { label: 'Improvement points', value: deliverable.improvementPoints },
    {
      label: 'Technical description',
      value: deliverable.technicalDescription ?? '—',
    },
    {
      label: 'System tags',
      value: deliverable.systemTags.map((tag) => tag.name).join(', ') || '—',
    },
    {
      label: 'User tags',
      value: deliverable.userTags.join(', ') || '—',
    },
    {
      label: 'Links',
      value:
        deliverable.links
          .map((link) => (link.label ? `${link.label}: ${link.url}` : link.url))
          .join('\n') || '—',
    },
    { label: 'Created at', value: new Date(deliverable.createdAt).toLocaleString() },
    { label: 'Updated at', value: new Date(deliverable.updatedAt).toLocaleString() },
  ];

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {fields.map((field) => (
        <Box key={field.label}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
            {field.label}
          </Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{field.value}</Typography>
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
}: TeamDeliverableReviewModalProps) {
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
              : 'Unable to load deliverable details.',
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
  }, [open, accessToken, deliverableId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Review deliverable</DialogTitle>
      <DialogContent dividers>
        <Tabs
          value={activeTab}
          onChange={(_event, nextTab) => setActiveTab(nextTab)}
          aria-label="Deliverable review tabs"
        >
          <Tab label="Details" />
          <Tab label="Notes" />
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {activeTab === 0 ? (
            isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} aria-label="Loading deliverable details" />
              </Box>
            ) : errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : deliverable ? (
              <DeliverableFieldsPanel deliverable={deliverable} />
            ) : null
          ) : (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              Additional review notes will be available here in a future update.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
