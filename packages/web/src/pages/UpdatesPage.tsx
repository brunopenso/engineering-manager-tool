import { Container, Box, Paper, Typography, Stack, Card, CardContent } from '@mui/material';

export default function UpdatesPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ marginBottom: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              marginBottom: 1,
            }}
          >
            Team Updates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Latest updates from your team
          </Typography>
        </Box>

        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Updates will appear here
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Check back soon for team updates and announcements.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
}
