import { Container, Box, Paper, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DEFAULT_APP_ROUTE } from '../routes/shellOptions.js';

export default function OptionUnavailablePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('shell');

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            textAlign: 'center',
            backgroundColor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={3}>
            <Box sx={{ fontSize: '4rem' }}>🔒</Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            >
              {t('unavailable.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('unavailable.body')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(DEFAULT_APP_ROUTE, { replace: true })}
              sx={{ alignSelf: 'center', mt: 2 }}
            >
              {t('unavailable.backToHome')}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
