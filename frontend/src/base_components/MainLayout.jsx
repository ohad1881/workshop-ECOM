import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatWidget, { CHAT_DRAWER_WIDTH } from '../chat/ChatWidget';
import { useAuth } from '../context/auth/useAuth';
import { useChatWidget } from '../context/chatWidget/useChatWidget';

// The primary app shell: Navbar + centered content + Footer. Used as a layout
// route — nested routes render into the <Outlet/>. The AI chat widget mounts here
// (authenticated only) so it persists across route changes.
const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const { open: chatOpen } = useChatWidget();

  // When the assistant is open, shrink the page to the left (desktop only) so the
  // persistent drawer sits beside the content instead of floating over it. On
  // mobile the drawer is full-width, so we keep it as an overlay (no shift).
  const shift = isAuthenticated && chatOpen;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        marginRight: { xs: 0, sm: shift ? `${CHAT_DRAWER_WIDTH}px` : 0 },
        transition: (theme) =>
          theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: shift
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
      }}
    >
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
