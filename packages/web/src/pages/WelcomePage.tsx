import { Container, Box, Paper, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function WelcomePage() {
  const { t } = useTranslation('shell');

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            backgroundColor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={3}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                textAlign: 'center',
              }}
            >
              {t('welcome.title')}
            </Typography>

            <Stack spacing={2} sx={{ textAlign: 'justify' }}>
              <Typography variant="body1" color="text.secondary">
                {t('welcome.paragraph1')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('welcome.paragraph2')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('welcome.paragraph3')}
              </Typography>
            </Stack>

            <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('welcome.cta')}
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
