import { Box, Button, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth/useAuth';
import UserSearch from './UserSearch';
import logo from '../assets/logo.png';

// Home-only hero block (single-use; lives directly in the home/ page folder).
const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Box
        component="img"
        src={logo}
        alt="GiftGraph"
        sx={{ width: { xs: 65, sm: 65 }, height: 'auto', mb: 2, mx: 'auto', display: 'block' }}
      />
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
        <>
          <Button variant="contained" size="large" onClick={() => navigate('/gift-builder')}>
            Build a Gift
          </Button>
          <UserSearch />
        </>
      )}
    </Box>
  );
};

export default HeroSection;
