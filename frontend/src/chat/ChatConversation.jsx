import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, CircularProgress, Paper, Alert } from '@mui/material';
import { getSession } from '../api/chat';
import { useChatWidget } from '../context/chatWidget/useChatWidget';
import Spinner from '../general_components/Spinner';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';

const ChatConversation = ({ sessionId }) => {
  const { stream, sendInSession } = useChatWidget();
  const bottomRef = useRef(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ['chat', 'session', sessionId],
    queryFn: () => getSession(sessionId),
  });

  const messages = (session?.messages || []).filter((m) => m.role === 'user' || m.role === 'assistant');
  const streamingHere = stream.sessionId === sessionId && (stream.isStreaming || stream.buffer);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, stream.buffer, streamingHere]);

  const send = ({ content, mentionedUserIds, mentionedProductIds }) =>
    sendInSession({ sessionId, content, mentionedUserIds, mentionedProductIds });

  if (isLoading) return <Spinner />;

  const empty = messages.length === 0 && !streamingHere;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        {empty && (
          <Box sx={{ textAlign: 'center', mt: 2, px: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Your gifting assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tell me who you're shopping for and your budget, and I'll find products or build a
              gift bundle within it. Tag a GiftGraph user with <strong>@</strong> or a product with{' '}
              <strong>#</strong>, or just describe the person — I'll figure out the rest and ask if I
              need more.
            </Typography>
          </Box>
        )}

        {messages.map((m) => <ChatMessage key={m.id} message={m} />)}

        {streamingHere && (
          <>
            {stream.pendingUser && (
              <ChatMessage message={{ id: 'pending-user', role: 'user', content: stream.pendingUser }} />
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
              <Paper elevation={0} sx={{ px: 1.5, py: 1, bgcolor: 'chatSurface', borderRadius: 2 }}>
                {stream.buffer
                  ? <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{stream.buffer}</Typography>
                  : <CircularProgress size={18} />}
              </Paper>
            </Box>
          </>
        )}

        {stream.sessionId === sessionId && stream.error && (
          <Alert severity="error" sx={{ mt: 1 }}>{stream.error}</Alert>
        )}

        <div ref={bottomRef} />
      </Box>

      <ChatComposer onSend={send} disabled={streamingHere && stream.isStreaming} />
    </Box>
  );
};

export default ChatConversation;
