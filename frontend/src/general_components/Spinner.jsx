import { Box, CircularProgress } from '@mui/material';

// Centered loading spinner. `fullHeight` vertically centers it in the viewport.
const Spinner = ({ fullHeight = false }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: fullHeight ? '60vh' : 'auto',
      py: 4,
    }}
  >
    <CircularProgress />
  </Box>
);

export default Spinner;
