import { Container, Box, Paper, Typography, Stack } from '@mui/material';

export default function WelcomePage() {
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
          <Stack spacing={2} sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                marginBottom: 2,
              }}
            >
              Welcome
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Select an option from the menu to continue
            </Typography>
            <Box sx={{ color: 'primary.light', fontSize: '3rem' }}>
              👋
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
