import { Box, Button, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth/useAuth';

// Home-only hero block (single-use; lives directly in the home/ page folder).
const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" sx={{ mb: 2 }}>
        Welcome to GiftGraph
      </Typography>
      <Typography variant="h4" sx={{ color: 'text.secondary', mb: 4, fontWeight: 400 }}>
        Find the perfect gift powered by AI
      </Typography>

      {!isAuthenticated ? (
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" size="large" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/register')}>
            Register
          </Button>
        </Stack>
      ) : (
        <Button variant="contained" size="large" onClick={() => navigate('/gift-finder')}>
          Find a Gift
        </Button>
      )}
    </Box>
  );
};

export default HeroSection;
