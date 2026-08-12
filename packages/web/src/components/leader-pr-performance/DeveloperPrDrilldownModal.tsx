import { useEffect, useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  fetchDeveloperPrDrilldown,
  LeaderPrPerformanceApiError,
  type DeveloperPrDrilldownItem,
  type DeveloperPrPerformanceRow,
} from '../../services/leaderPrPerformanceApi.js';

type DeveloperPrDrilldownModalProps = {
  open: boolean;
  accessToken: string;
  developer: DeveloperPrPerformanceRow | null;
  startDate: string;
  endDate: string;
  onClose: () => void;
};

export default function DeveloperPrDrilldownModal({
  open,
  accessToken,
  developer,
  startDate,
  endDate,
  onClose,
}: DeveloperPrDrilldownModalProps) {
  const { t } = useTranslation('leader');
  const [items, setItems] = useState<DeveloperPrDrilldownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !developer) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetchDeveloperPrDrilldown(accessToken, {
          userId: developer!.userId,
          startDate,
          endDate,
        });
        if (!cancelled) {
          setItems(response.pullRequests);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof LeaderPrPerformanceApiError
              ? error.message
              : t('teamPrPerformance.drilldownLoadError'),
          );
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, developer, endDate, open, startDate, t]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      data-testid="pr-performance-drilldown-modal"
    >
      <DialogTitle>
        {t('teamPrPerformance.drilldownTitle', {
          name: developer?.displayName || developer?.email || '',
        })}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Stack sx={{ alignItems: 'center', py: 4 }}>
            <CircularProgress aria-label={t('teamPrPerformance.loadingDrilldown')} />
          </Stack>
        ) : null}
        {errorMessage ? (
          <Typography color="error" role="alert">
            {errorMessage}
          </Typography>
        ) : null}
        {!isLoading && !errorMessage && items.length === 0 ? (
          <Typography color="text.secondary">{t('teamPrPerformance.drilldownEmpty')}</Typography>
        ) : null}
        {!isLoading && items.length > 0 ? (
          <Table size="small" aria-label={t('teamPrPerformance.drilldownTableAria')}>
            <TableHead>
              <TableRow>
                <TableCell>{t('teamPrPerformance.drilldownColumns.title')}</TableCell>
                <TableCell>{t('teamPrPerformance.drilldownColumns.repository')}</TableCell>
                <TableCell>{t('teamPrPerformance.drilldownColumns.mergedAt')}</TableCell>
                <TableCell>{t('teamPrPerformance.drilldownColumns.role')}</TableCell>
                <TableCell>{t('teamPrPerformance.drilldownColumns.classification')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} data-testid={`pr-performance-drilldown-row-${item.id}`}>
                  <TableCell>
                    {item.url ? (
                      <Link href={item.url} target="_blank" rel="noreferrer">
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </TableCell>
                  <TableCell>{item.repository}</TableCell>
                  <TableCell>{item.mergedAt.slice(0, 10)}</TableCell>
                  <TableCell>{t(`teamPrPerformance.roles.${item.involvementRole}`)}</TableCell>
                  <TableCell>
                    {t(`teamPrPerformance.classification.${item.effectiveClassification}`)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-testid="pr-performance-drilldown-close">
          {t('teamPrPerformance.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
