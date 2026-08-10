import {
  Box,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';

type HeaderIdentityActionProps = {
  fullName: string;
  email: string;
  isConfirmingLogout: boolean;
  onIdentityClick: () => void;
  onConfirmLogout: () => void;
  onCancelLogout: () => void;
};

function getInitials(fullName: string, email: string): string {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length > 0) {
    return nameParts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  return email
    .split('@')[0]
    .split('.')
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function HeaderIdentityAction({
  fullName,
  email,
  isConfirmingLogout,
  onIdentityClick,
  onConfirmLogout,
  onCancelLogout,
}: HeaderIdentityActionProps) {
  const { t } = useTranslation(['shell', 'common']);
  const initials = getInitials(fullName, email);

  return (
    <Box>
      <Button
        color="inherit"
        onClick={onIdentityClick}
        startIcon={<Avatar sx={{ width: 32, height: 32 }}>{initials}</Avatar>}
        sx={{
          textTransform: 'none',
          '& .MuiButton-startIcon': {
            marginRight: 1,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            lineHeight: 1.2,
          }}
        >
          <Typography component="span" sx={{ fontSize: '0.875rem' }}>
            {fullName}
          </Typography>
          <Typography component="span" sx={{ fontSize: '0.75rem', opacity: 0.85 }}>
            {email}
          </Typography>
        </Box>
      </Button>

      <Dialog open={isConfirmingLogout} onClose={onCancelLogout}>
        <DialogTitle>{t('logout.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('logout.body')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelLogout} color="primary">
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={onConfirmLogout}
            color="error"
            variant="contained"
            startIcon={<LogoutIcon />}
            autoFocus
          >
            {t('logout.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
