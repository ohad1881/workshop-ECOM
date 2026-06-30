import { Fab, Drawer, Box, Typography, IconButton, Badge } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useChatWidget } from '../context/chatWidget/useChatWidget';
import SessionList from './SessionList';
import ChatConversation from './ChatConversation';

// Drawer width on desktop. Shared with MainLayout so it can shift the page
// content left by the same amount when the assistant is open.
export const CHAT_DRAWER_WIDTH = 400;

// Global floating assistant. Non-modal (persistent Drawer, no backdrop) so the user
// can keep browsing while the AI streams. State + in-flight stream live in the provider.
const ChatWidget = () => {
  const { open, view, activeSessionId, stream, openChat, close, showList } = useChatWidget();
  const thinking = stream.isStreaming;

  return (
    <>
      {!open && (
        <Fab
          color="primary"
          aria-label="Open gift assistant"
          onClick={() => openChat()}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
        >
          <Badge color="secondary" variant="dot" invisible={!thinking}>
            <SmartToyIcon />
          </Badge>
        </Fab>
      )}

      <Drawer
        anchor="right"
        open={open}
        variant="persistent"
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100vw', sm: CHAT_DRAWER_WIDTH },
              maxWidth: '100vw',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              overflowX: 'hidden',
              bgcolor: 'grey.300', // darker canvas; bubbles/cards stay light to pop
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          {view !== 'list' && (
            <IconButton size="small" onClick={showList} aria-label="Back to conversations">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <SmartToyIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
            Gift Assistant
          </Typography>
          <IconButton size="small" onClick={close} aria-label="Close gift assistant">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          {view === 'list' && <SessionList />}
          {view === 'conversation' && activeSessionId && <ChatConversation sessionId={activeSessionId} />}
        </Box>
      </Drawer>
    </>
  );
};

export default ChatWidget;
