import { Box, Container, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        py: 2,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 1.5,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main' }}>
              GiftGraph
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Find the perfect gift powered by AI.
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Link component={RouterLink} to="/" underline="hover" color="text.secondary">
                Home
              </Link>
              <Link component={RouterLink} to="/gift-builder" underline="hover" color="text.secondary">
                Build a Gift
              </Link>
              <Link component={RouterLink} to="/products" underline="hover" color="text.secondary">
                Products
              </Link>
              <Link component={RouterLink} to="/wishlist" underline="hover" color="text.secondary">
                My Wishlist
              </Link>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Link component={RouterLink} to="/privacy" underline="hover" color="text.secondary">
                Privacy Policy
              </Link>
              <Link component={RouterLink} to="/terms" underline="hover" color="text.secondary">
                Terms of Service
              </Link>
            </Box>
          </Box>
        </Box>

        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            &copy; {year} GiftGraph. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
