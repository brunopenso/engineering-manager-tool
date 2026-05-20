import { Container, Box, Paper, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_APP_ROUTE } from '../routes/shellOptions.js';

export default function OptionUnavailablePage() {
  const navigate = useNavigate();

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
              Feature Unavailable
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This menu option is currently unavailable. Please check back later or
              select another option from the menu.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(DEFAULT_APP_ROUTE, { replace: true })}
              sx={{ alignSelf: 'center', mt: 2 }}
            >
              Back to Home
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
