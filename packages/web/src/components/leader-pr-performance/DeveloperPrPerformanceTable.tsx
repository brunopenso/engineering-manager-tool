import { useState } from 'react';
import {
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
import { useTranslation } from 'react-i18next';
import type { DeveloperPrPerformanceRow } from '../../services/leaderPrPerformanceApi.js';

type DeveloperPrPerformanceTableProps = {
  developers: DeveloperPrPerformanceRow[];
  onSelectDeveloper: (developer: DeveloperPrPerformanceRow) => void;
};

export default function DeveloperPrPerformanceTable({
  developers,
  onSelectDeveloper,
}: DeveloperPrPerformanceTableProps) {
  const { t } = useTranslation('leader');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const paged = developers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper variant="outlined" data-testid="pr-performance-developers-table">
      <Typography variant="h6" component="h2" sx={{ px: 2, pt: 2 }}>
        {t('teamPrPerformance.tableTitle')}
      </Typography>
      <TableContainer>
        <Table size="small" aria-label={t('teamPrPerformance.tableAria')}>
          <TableHead>
            <TableRow>
              <TableCell>{t('teamPrPerformance.columns.developer')}</TableCell>
              <TableCell align="right">{t('teamPrPerformance.columns.authored')}</TableCell>
              <TableCell align="right">{t('teamPrPerformance.columns.comments')}</TableCell>
              <TableCell align="right">{t('teamPrPerformance.columns.reviews')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary">
                    {t('teamPrPerformance.emptyFiltered')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => (
                <TableRow
                  key={row.userId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onSelectDeveloper(row)}
                  data-testid={`pr-performance-developer-row-${row.userId}`}
                >
                  <TableCell>{row.displayName || row.email}</TableCell>
                  <TableCell align="right">{row.authoredPullRequestCount}</TableCell>
                  <TableCell align="right">{row.commentCount}</TableCell>
                  <TableCell align="right">{row.reviewCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={developers.length}
        page={page}
        onPageChange={(_event, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number.parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
}
