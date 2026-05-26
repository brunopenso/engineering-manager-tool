import { Container, Box, Paper, Typography, Stack, Divider } from '@mui/material';
import { useAuth } from '../auth/AuthProvider.js';
import RoleBadgeList from '../components/profile/RoleBadgeList.js';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              Your profile
            </Typography>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1">{user.fullName}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{user.email}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Active roles
              </Typography>
              <RoleBadgeList roles={user.roles} />
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
