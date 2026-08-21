import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { MyActivityPullRequest } from '../../services/myPullRequestsApi.js';
import { repositoryKey } from '../../utils/myPullRequestActivity.js';
import { formatDisplayDate } from '../../utils/formatDisplayDate.js';
import type { DateFormatPreference, LanguagePreference } from '../../types/profilePreferences.js';
import { LabeledValue } from '../ui/LabeledField.js';

type PullRequestDetailModalProps = {
  open: boolean;
  pullRequest: MyActivityPullRequest | null;
  dateFormatPreference: DateFormatPreference;
  languagePreference: LanguagePreference;
  onClose: () => void;
};

export default function PullRequestDetailModal({
  open,
  pullRequest,
  dateFormatPreference,
  languagePreference,
  onClose,
}: PullRequestDetailModalProps) {
  const { t } = useTranslation('prActivity');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" data-testid="pr-detail-modal">
      <DialogTitle>{t('modal.title')}</DialogTitle>
      <DialogContent dividers>
        {pullRequest ? (
          <Stack spacing={2}>
            <LabeledValue label={t('modal.fields.title')} value={pullRequest.title} />
            <LabeledValue label={t('modal.fields.organization')} value={pullRequest.organization} />
            <LabeledValue
              label={t('modal.fields.repository')}
              value={repositoryKey(pullRequest)}
            />
            <LabeledValue label={t('modal.fields.number')} value={`#${pullRequest.number}`} />
            <LabeledValue label={t('modal.fields.author')} value={pullRequest.authorGithubLogin} />
            <LabeledValue
              label={t('modal.fields.mergedAt')}
              value={formatDisplayDate(
                pullRequest.mergedAt.slice(0, 10),
                dateFormatPreference,
                languagePreference,
              )}
            />
            <LabeledValue
              label={t('modal.fields.role')}
              value={
                pullRequest.involvementRole === 'owner' ? t('table.owner') : t('table.involved')
              }
            />
            <LabeledValue
              label={t('modal.fields.branches')}
              value={`${pullRequest.sourceBranch} → ${pullRequest.targetBranch}`}
            />
            <LabeledValue
              label={t('modal.fields.changes')}
              value={`+${pullRequest.additionsCount} / -${pullRequest.deletionsCount} (${pullRequest.changedFilesCount} files)`}
            />
            <LabeledValue
              label={t('modal.fields.body')}
              value={pullRequest.body?.trim() ? pullRequest.body : t('modal.fields.noBody')}
            />
            {pullRequest.url ? (
              <Link href={pullRequest.url} target="_blank" rel="noopener noreferrer">
                {t('modal.fields.url')}
              </Link>
            ) : null}

            <Divider />
            <Typography variant="subtitle1">{t('modal.fields.comments')}</Typography>
            {pullRequest.comments.length === 0 ? (
              <Typography color="text.secondary">{t('modal.fields.noComments')}</Typography>
            ) : (
              pullRequest.comments.map((comment) => (
                <Box key={comment.id} sx={{ pl: 1, borderLeft: 2, borderColor: 'divider' }}>
                  <Typography variant="subtitle2">{comment.authorGithubLogin}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {comment.body}
                  </Typography>
                </Box>
              ))
            )}

            <Divider />
            <Typography variant="subtitle1">{t('modal.fields.reviews')}</Typography>
            {pullRequest.reviews.length === 0 ? (
              <Typography color="text.secondary">{t('modal.fields.noReviews')}</Typography>
            ) : (
              pullRequest.reviews.map((review) => (
                <Box key={review.id} sx={{ pl: 1, borderLeft: 2, borderColor: 'divider' }}>
                  <Typography variant="subtitle2">
                    {review.reviewerGithubLogin} · {review.state}
                  </Typography>
                  {review.body ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {review.body}
                    </Typography>
                  ) : null}
                </Box>
              ))
            )}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('modal.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
