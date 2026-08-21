import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import {
  createDeliverable,
  DeliverablesApiError,
  type DeliverableWriteInput,
} from '../../services/deliverablesApi.js';
import {
  analyzeDeliverableFromPullRequests,
  MyPullRequestsApiError,
  type DeliverableProposal,
} from '../../services/myPullRequestsApi.js';
import { DELIVERABLES_ROUTE } from '../../routes/shellOptions.js';
import { LabeledValue } from '../ui/LabeledField.js';

type ModalPhase = 'loading' | 'review' | 'creating' | 'success' | 'error';

type CreateDeliverableFromPrsModalProps = {
  open: boolean;
  accessToken: string;
  pullRequestIds: string[];
  onClose: () => void;
  onCreated: () => void;
};

function proposalToWriteInput(proposal: DeliverableProposal): DeliverableWriteInput {
  return {
    title: proposal.title,
    description: proposal.description,
    roleInDeliverable: proposal.roleInDeliverable,
    systemTagIds: proposal.systemTagIds,
    businessImpact: proposal.businessImpact,
    improvementPoints: proposal.improvementPoints,
    technicalDescription: proposal.technicalDescription,
    userTags: proposal.userTags,
    links: proposal.links,
  };
}

export default function CreateDeliverableFromPrsModal({
  open,
  accessToken,
  pullRequestIds,
  onClose,
  onCreated,
}: CreateDeliverableFromPrsModalProps) {
  const { t } = useTranslation('prActivity');
  const [phase, setPhase] = useState<ModalPhase>('loading');
  const [proposal, setProposal] = useState<DeliverableProposal | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    const generation = ++requestGeneration.current;
    setPhase('loading');
    setProposal(null);
    setErrorMessage(null);
    setCreatedId(null);

    void (async () => {
      try {
        const response = await analyzeDeliverableFromPullRequests(accessToken, {
          pullRequestIds,
        });
        if (requestGeneration.current !== generation) {
          return;
        }
        setProposal(response.proposal);
        setPhase('review');
      } catch (error) {
        if (requestGeneration.current !== generation) {
          return;
        }
        setErrorMessage(
          error instanceof MyPullRequestsApiError
            ? error.message
            : t('createDeliverable.errors.analyzeFailed'),
        );
        setPhase('error');
      }
    })();

    return () => {
      requestGeneration.current += 1;
    };
    // Depend on id membership string so a new array instance with the same IDs does not retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pullRequestIds.join(',') is intentional
  }, [open, accessToken, pullRequestIds.join(','), t]);

  const handleClose = () => {
    if (phase === 'creating') {
      return;
    }
    onClose();
  };

  const handleConfirm = async () => {
    if (!proposal || phase === 'creating') {
      return;
    }

    setPhase('creating');
    setErrorMessage(null);
    try {
      const deliverable = await createDeliverable(accessToken, proposalToWriteInput(proposal));
      setCreatedId(deliverable.id);
      setPhase('success');
      onCreated();
    } catch (error) {
      setErrorMessage(
        error instanceof DeliverablesApiError || error instanceof MyPullRequestsApiError
          ? error.message
          : t('createDeliverable.errors.createFailed'),
      );
      setPhase('error');
    }
  };

  const busy = phase === 'loading' || phase === 'creating';

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="create-deliverable-from-prs-title"
      aria-busy={busy}
    >
      <DialogTitle id="create-deliverable-from-prs-title">
        {t('createDeliverable.title')}
      </DialogTitle>
      <DialogContent dividers>
        {phase === 'loading' ? (
          <Stack
            spacing={2}
            sx={{ py: 3, alignItems: 'center' }}
            data-testid="create-deliverable-loading"
          >
            <CircularProgress size={36} aria-label={t('createDeliverable.loading')} />
            <Typography>{t('createDeliverable.loading')}</Typography>
          </Stack>
        ) : null}

        {phase === 'review' && proposal ? (
          <Stack spacing={2} data-testid="create-deliverable-review">
            <Typography variant="body2" color="text.secondary">
              {t('createDeliverable.review.intro')}
            </Typography>
            <LabeledValue label={t('createDeliverable.review.title')} value={proposal.title} />
            <LabeledValue
              label={t('createDeliverable.review.description')}
              value={proposal.description}
            />
            <LabeledValue
              label={t('createDeliverable.review.role')}
              value={proposal.roleInDeliverable}
            />
            <LabeledValue
              label={t('createDeliverable.review.businessImpact')}
              value={proposal.businessImpact}
            />
            <LabeledValue
              label={t('createDeliverable.review.improvementPoints')}
              value={proposal.improvementPoints}
            />
          </Stack>
        ) : null}

        {phase === 'creating' ? (
          <Stack
            spacing={2}
            sx={{ py: 3, alignItems: 'center' }}
            data-testid="create-deliverable-creating"
          >
            <CircularProgress size={36} aria-label={t('createDeliverable.creating')} />
            <Typography>{t('createDeliverable.creating')}</Typography>
          </Stack>
        ) : null}

        {phase === 'success' && createdId ? (
          <Stack spacing={2} data-testid="create-deliverable-success">
            <Alert severity="success">{t('createDeliverable.success.message')}</Alert>
            <Button
              component={RouterLink}
              to={`${DELIVERABLES_ROUTE}/${createdId}/edit`}
              variant="contained"
              data-testid="create-deliverable-complement-link"
              onClick={onClose}
            >
              {t('createDeliverable.success.complement')}
            </Button>
          </Stack>
        ) : null}

        {phase === 'error' && errorMessage ? (
          <Alert severity="error" data-testid="create-deliverable-error">
            {errorMessage}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions>
        {phase === 'success' ? (
          <Button onClick={handleClose}>{t('createDeliverable.close')}</Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={phase === 'creating'}>
              {t('createDeliverable.cancel')}
            </Button>
            {phase === 'review' ? (
              <Button
                variant="contained"
                onClick={() => void handleConfirm()}
                data-testid="create-deliverable-confirm"
              >
                {t('createDeliverable.confirm')}
              </Button>
            ) : null}
            {phase === 'error' && proposal ? (
              <Button
                variant="contained"
                onClick={() => {
                  setPhase('review');
                  setErrorMessage(null);
                }}
              >
                {t('createDeliverable.retry')}
              </Button>
            ) : null}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
