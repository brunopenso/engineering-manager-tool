import {
  Box,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

type HeaderIdentityActionProps = {
  email: string;
  isConfirmingLogout: boolean;
  onIdentityClick: () => void;
  onConfirmLogout: () => void;
  onCancelLogout: () => void;
};

export default function HeaderIdentityAction({
  email,
  isConfirmingLogout,
  onIdentityClick,
  onConfirmLogout,
  onCancelLogout,
}: HeaderIdentityActionProps) {
  // Get initials from email
  const initials = email
    .split('@')[0]
    .split('.')
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <Box>
      <Button
        color="inherit"
        onClick={onIdentityClick}
        startIcon={<Avatar sx={{ width: 32, height: 32 }}>{initials}</Avatar>}
        sx={{
          textTransform: 'none',
          fontSize: '0.875rem',
          '& .MuiButton-startIcon': {
            marginRight: 1,
          },
        }}
      >
        {email}
      </Button>

      <Dialog open={isConfirmingLogout} onClose={onCancelLogout}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to log out? You'll need to sign in again to
            access the application.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelLogout} color="primary">
            Cancel
          </Button>
          <Button
            onClick={onConfirmLogout}
            color="error"
            variant="contained"
            startIcon={<LogoutIcon />}
            autoFocus
          >
            Log Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
