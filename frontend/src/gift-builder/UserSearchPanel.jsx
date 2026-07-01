import { useState } from 'react';
import { TextField, Box, Typography, Grid, Alert, Button } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '../api/users';
import { useDebounce } from '../general_hooks/useDebounce';
import UserCard from '../general_components/UserCard';
import Spinner from '../general_components/Spinner';
import { useChatWidget } from '../context/chatWidget/useChatWidget';

const UserSearchPanel = ({ onSelect }) => {
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
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>Select Recipient</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search for the person you want to find a gift for.
      </Typography>
      <TextField
        fullWidth
        placeholder="Search by username..."
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
      {!isLoading && debouncedQuery.trim().length < 2 && (
        <Typography variant="body2" color="text.secondary">
          Type at least 2 characters to search.
        </Typography>
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <UserCard user={user} onClick={() => onSelect(user)} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UserSearchPanel;
