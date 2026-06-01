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
              Welcome
            </Typography>

            <Stack spacing={2} sx={{ textAlign: 'justify' }}>
              <Typography variant="body1" color="text.secondary">
                Engineering managers and their teams use this tool to capture
                deliverables, track impact and growth, and understand team
                structure in one place.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Every user is a collaborator who manages their own deliverables
                and profile. Leaders additionally review team deliverables and
                manage reporting hierarchy. Administrators configure user roles
                and the shared tag catalog.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You only see menu options and data your role allows. Leaders read
                subordinate deliverables read-only, peers cannot see each
                other&apos;s work, and administrators govern organization-wide
                settings.
              </Typography>
            </Stack>

            <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center' }}>
              Select an option from the menu to continue
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
