import { Box, Button, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth/useAuth';
import UserSearch from './UserSearch';
import logo from '../assets/logo.png';

// Slow drift + pulse for the background glow orbs — kept subtle so it reads as
// ambient light, not a distraction.
const drift = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(3%, -4%) scale(1.08); }
`;
const glowPulse = keyframes`
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.85; }
`;

// Home-only hero block (single-use; lives directly in the home/ page folder).
const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ position: 'relative', textAlign: 'center', py: 8, overflow: 'hidden' }}>
      {/* Ambient glow orbs — purple + gold, matching the brand palette. */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '10%',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.55), transparent 70%)',
          filter: 'blur(60px)',
          animation: `${drift} 10s ease-in-out infinite, ${glowPulse} 6s ease-in-out infinite`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: '-20%',
          right: '12%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.4), transparent 70%)',
          filter: 'blur(60px)',
          animation: `${drift} 12s ease-in-out infinite reverse, ${glowPulse} 7s ease-in-out infinite`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          component="img"
          src={logo}
          alt="GiftGraph"
          sx={{
            width: { xs: 110, sm: 150 },
            height: 'auto',
            mb: 3,
            mx: 'auto',
            display: 'block',
            filter: 'drop-shadow(0 0 32px rgba(139, 92, 246, 0.7))',
          }}
        />
        <Typography variant="h1" sx={{ mb: 1, fontSize: { xs: '3rem', sm: '4rem' } }}>
          GiftGraph
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.secondary', mb: 1, fontWeight: 400 }}>
          Find the perfect gift powered by AI.
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'secondary.main', mb: 4, fontWeight: 600, letterSpacing: '0.5px' }}
        >
          Search for people, not products.
        </Typography>

        {!isAuthenticated ? (
          <Button variant="contained" size="large" onClick={() => navigate('/login')}>
            Let's Get Started
          </Button>
        ) : (
          <>
            <Button variant="contained" size="large" onClick={() => navigate('/gift-builder')}>
              Build a Gift
            </Button>
            <UserSearch />
          </>
        )}
      </Box>
    </Box>
  );
};

export default HeroSection;
