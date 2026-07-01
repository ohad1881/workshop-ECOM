import { useState } from 'react';
import { TextField, Paper, Typography, Grid, Alert, Button } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchUsers } from '../api/users';
import { useDebounce } from '../general_hooks/useDebounce';
import UserCard from '../general_components/UserCard';
import Spinner from '../general_components/Spinner';
import { useChatWidget } from '../context/chatWidget/useChatWidget';

// Home-only user search: find a user and jump to their profile. When nobody
// matches, offers a shortcut into the AI assistant's "stranger mode" — it
// interviews the giver (likes, budget, ...) and builds a bundle from that
// instead of a registered profile.
const UserSearch = () => {
  const navigate = useNavigate();
  const { startSession } = useChatWidget();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  });

  const askGiftBot = () => {
    startSession({
      stranger_description: `I'm looking for a gift for someone named "${debouncedQuery}" but couldn't find them on GiftGraph.`,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: 720,
        mx: 'auto',
        mt: 5,
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 3,
        textAlign: 'left',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.12)',
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Find someone to gift
      </Typography>
      <TextField
        fullWidth
        placeholder="Search for a user..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />
      {isLoading && <Spinner />}
      {!isLoading && debouncedQuery.trim().length >= 2 && users.length === 0 && (
        <Alert
          severity="info"
          action={
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<SmartToyIcon fontSize="small" />}
              onClick={askGiftBot}
              sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}
            >
              Gift Bot can help
            </Button>
          }
        >
          No users found for &ldquo;{debouncedQuery}&rdquo;
        </Alert>
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <UserCard user={user} onClick={() => navigate(`/users/${user.id}`)} />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default UserSearch;
