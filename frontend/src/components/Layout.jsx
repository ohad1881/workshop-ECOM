import React from 'react';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';

export const Layout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Navbar />
      <Box component="main" sx={{ flex: 1, py: 4 }}>
        <Container maxWidth="lg">{children}</Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
