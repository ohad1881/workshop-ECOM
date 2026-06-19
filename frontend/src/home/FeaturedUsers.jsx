import { Box, Typography } from '@mui/material';

// Home-only section. Stub for now — will list public/featured users later.
// TODO: implement page
const FeaturedUsers = () => (
  <Box sx={{ py: 4 }}>
    <Typography variant="h3" sx={{ mb: 2, textAlign: 'center' }}>
      Featured Users
    </Typography>
    <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
      Coming soon.
    </Typography>
  </Box>
);

export default FeaturedUsers;
