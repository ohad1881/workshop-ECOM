import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatWidget from '../chat/ChatWidget';
import { useAuth } from '../context/auth/useAuth';

// The primary app shell: Navbar + centered content + Footer. Used as a layout
// route — nested routes render into the <Outlet/>. The AI chat widget mounts here
// (authenticated only) so it persists across route changes.
const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1, py: 4 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
      <Footer />
      {isAuthenticated && <ChatWidget />}
    </Box>
  );
};

export default MainLayout;
