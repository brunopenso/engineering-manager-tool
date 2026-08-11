import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MyActivityPullRequest } from '../../services/myPullRequestsApi.js';
import { repositoryKey } from '../../utils/myPullRequestActivity.js';
import { formatDisplayDate } from '../../utils/formatDisplayDate.js';
import type { DateFormatPreference, LanguagePreference } from '../../types/profilePreferences.js';

type MyPullRequestsTableProps = {
  pullRequests: MyActivityPullRequest[];
  dateFormatPreference: DateFormatPreference;
  languagePreference: LanguagePreference;
  onSelect: (pr: MyActivityPullRequest) => void;
};

function classificationChipColor(
  type: MyActivityPullRequest['classificationType'],
): 'primary' | 'warning' | 'info' | 'secondary' | 'default' {
  if (type === 'feature') {
    return 'primary';
  }
  if (type === 'fix') {
    return 'warning';
  }
  if (type === 'documentation') {
    return 'info';
  }
  if (type === 'maintenance') {
    return 'secondary';
  }
  return 'default';
}

export default function MyPullRequestsTable({
  pullRequests,
  dateFormatPreference,
  languagePreference,
  onSelect,
}: MyPullRequestsTableProps) {
  const { t } = useTranslation('prActivity');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const pageRows = pullRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper variant="outlined" data-testid="my-pull-requests-table">
      <TableContainer>
        <Table aria-label={t('title')}>
          <TableHead>
            <TableRow>
              <TableCell>{t('table.repository')}</TableCell>
              <TableCell>{t('table.titleColumn')}</TableCell>
              <TableCell>{t('table.classificationType')}</TableCell>
              <TableCell>{t('table.complexityIndex')}</TableCell>
              <TableCell>{t('table.prDate')}</TableCell>
              <TableCell>{t('table.role')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">{t('table.empty')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((pr) => (
                <TableRow
                  key={pr.id}
                  hover
                  tabIndex={0}
                  sx={{ cursor: 'pointer' }}
                  data-testid={`pr-row-${pr.id}`}
                  onClick={() => onSelect(pr)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(pr);
                    }
                  }}
                >
                  <TableCell>{repositoryKey(pr)}</TableCell>
                  <TableCell>{pr.title}</TableCell>
                  <TableCell>
                    {pr.classificationType ? (
                      <Chip
                        size="small"
                        color={classificationChipColor(pr.classificationType)}
                        label={t(`classification.${pr.classificationType}`)}
                        data-testid={`pr-classification-${pr.id}`}
                      />
                    ) : (
                      t('table.unknownValue')
                    )}
                  </TableCell>
                  <TableCell data-testid={`pr-complexity-${pr.id}`}>
                    {pr.complexityIndex ?? t('table.unknownValue')}
                  </TableCell>
                  <TableCell>
                    {formatDisplayDate(
                      pr.mergedAt.slice(0, 10),
                      dateFormatPreference,
                      languagePreference,
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={pr.involvementRole === 'owner' ? 'primary' : 'default'}
                      label={
                        pr.involvementRole === 'owner' ? t('table.owner') : t('table.involved')
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={pullRequests.length}
        page={page}
        onPageChange={(_event, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number.parseInt(event.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage={t('pagination.rowsPerPage')}
      />
    </Paper>
  );
}
