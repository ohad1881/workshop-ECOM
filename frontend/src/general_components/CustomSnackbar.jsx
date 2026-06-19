import { Snackbar, Alert } from '@mui/material';

// Bottom-center snackbar with an Alert body. `action` can hold e.g. an Undo button.
const CustomSnackbar = ({
  open,
  message,
  severity = 'info',
  onClose,
  action,
  autoHideDuration = 5000,
}) => (
  <Snackbar
    open={open}
    autoHideDuration={autoHideDuration}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    <Alert onClose={onClose} severity={severity} action={action} variant="filled" sx={{ width: '100%' }}>
      {message}
    </Alert>
  </Snackbar>
);

export default CustomSnackbar;
