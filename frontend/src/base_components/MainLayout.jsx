import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

// The primary app shell: Navbar + centered content + Footer. Used as a layout
// route — nested routes render into the <Outlet/>. 
const MainLayout = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Navbar />
    <Box component="main" sx={{ flex: 1, py: 4 }}>
      <Container maxWidth="lg">
        <Outlet />
      </Container>
    </Box>
    <Footer />
  </Box>
);

export default MainLayout;
