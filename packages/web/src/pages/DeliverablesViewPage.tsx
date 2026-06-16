import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Chip,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.js';
import {
  DeliverablesApiError,
  listUserDeliverables,
  type DeliverableSummary,
} from '../services/deliverablesApi.js';
import { formatDisplayDateTime } from '../utils/formatDisplayDate.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../types/profilePreferences.js';

export default function DeliverablesViewPage() {
  const { userId } = useParams<{ userId: string }>();
  const { accessToken, user } = useAuth();
  const { t } = useTranslation(['deliverables', 'common']);
  const [deliverables, setDeliverables] = useState<DeliverableSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const languagePreference = user?.languagePreference ?? DEFAULT_LANGUAGE_PREFERENCE;
  const dateFormatPreference = user?.dateFormatPreference ?? DEFAULT_DATE_FORMAT_PREFERENCE;

  useEffect(() => {
    async function load() {
      if (!accessToken || !userId) {
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await listUserDeliverables(accessToken, userId);
        setDeliverables(result.deliverables);
      } catch (error) {
        setErrorMessage(
          error instanceof DeliverablesApiError ? error.message : t('view.loadError'),
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [accessToken, userId, t]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('view.title')}
          </Typography>
          <Typography color="text.secondary">{t('view.subtitle')}</Typography>
        </Box>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Paper variant="outlined">
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              <Typography>{t('loading.deliverables', { ns: 'common' })}</Typography>
            </Box>
          ) : deliverables.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">{t('view.empty')}</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('fields.title', { ns: 'common' })}</TableCell>
                  <TableCell>{t('fields.impact', { ns: 'common' })}</TableCell>
                  <TableCell>{t('systemTags', { ns: 'common' })}</TableCell>
                  <TableCell>{t('dates.updated', { ns: 'common' })}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliverables.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{t(`impact.${item.businessImpact}`, { ns: 'common' })}</TableCell>
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
                    <TableCell>
                      {formatDisplayDateTime(
                        item.updatedAt,
                        dateFormatPreference,
                        languagePreference,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
