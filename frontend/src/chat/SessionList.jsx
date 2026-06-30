import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, List, ListItem, ListItemButton, ListItemText, IconButton, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { listSessions, deleteSession } from '../api/chat';
import { useChatWidget } from '../context/chatWidget/useChatWidget';
import Spinner from '../general_components/Spinner';
import { formatDate } from '../utils/formatters';

const sessionLabel = (s) => {
  if (s.title) return s.title;
  if (s.is_self_gift) return 'For myself';
  if (s.stranger_description) return 'For a stranger';
  if (s.recipient_id) return `For ${s.recipient_username}`;
  return 'Gift chat';
};

const SessionList = () => {
  const { startSession, openSession, activeSessionId, showList } = useChatWidget();
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: listSessions,
  });

  const remove = useMutation({
    mutationFn: deleteSession,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      if (id === activeSessionId) showList();
    },
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1.5 }}>
        <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={() => startSession()}>
          New chat
        </Button>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Spinner />
        ) : sessions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 2, py: 4 }}>
            No conversations yet. Start a new chat to find a gift.
          </Typography>
        ) : (
          <List dense>
            {sessions.map((s) => (
              <ListItem
                key={s.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label="Delete conversation"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(s.id)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton onClick={() => openSession(s.id)}>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600} noWrap>{sessionLabel(s)}</Typography>}
                    secondary={formatDate(s.updated_at)}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default SessionList;
