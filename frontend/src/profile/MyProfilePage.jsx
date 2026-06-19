import { Box, Typography } from '@mui/material';

// Stub — the logged-in user's own profile (inline-editable fields come later).
// TODO: implement page
const MyProfilePage = () => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Typography variant="h3" sx={{ mb: 1 }}>
      My Profile
    </Typography>
    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
      Coming soon.
    </Typography>
  </Box>
);

export default MyProfilePage;
