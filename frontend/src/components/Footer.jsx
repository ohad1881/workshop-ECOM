import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#2D3436',
        color: '#FFFFFF',
        py: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, mb: 4 }}>
          {/* Company */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              GiftGraph
            </Typography>
            <Typography variant="body2" sx={{ color: '#B2BEC3' }}>
              Find the perfect gift powered by AI.
            </Typography>
          </Box>

          {/* Links */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" underline="hover" sx={{ color: '#B2BEC3' }}>
                Home
              </Link>
              <Link href="/about" underline="hover" sx={{ color: '#B2BEC3' }}>
                About
              </Link>
              <Link href="/contact" underline="hover" sx={{ color: '#B2BEC3' }}>
                Contact
              </Link>
            </Box>
          </Box>

          {/* Legal */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/privacy" underline="hover" sx={{ color: '#B2BEC3' }}>
                Privacy Policy
              </Link>
              <Link href="/terms" underline="hover" sx={{ color: '#B2BEC3' }}>
                Terms of Service
              </Link>
            </Box>
          </Box>
        </Box>

        {/* Copyright */}
        <Box sx={{ borderTop: '1px solid #636E72', pt: 2 }}>
          <Typography variant="body2" sx={{ color: '#B2BEC3', textAlign: 'center' }}>
            &copy; {currentYear} GiftGraph. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
