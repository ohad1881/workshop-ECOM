import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

// Stub — viewing another user's public profile (route /users/:id).
// TODO: implement page
const UserProfilePage = () => {
  const { id } = useParams();
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        User Profile #{id}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        Coming soon.
      </Typography>
    </Box>
  );
};

export default UserProfilePage;
