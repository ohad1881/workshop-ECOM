import { Box, Typography } from '@mui/material';

// Stub — AI chat window + SSE streaming UI come later (api/chat.js handles transport).
// TODO: implement page
const ChatPage = () => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Typography variant="h3" sx={{ mb: 1 }}>
      AI Chat
    </Typography>
    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
      Coming soon.
    </Typography>
  </Box>
);

export default ChatPage;
