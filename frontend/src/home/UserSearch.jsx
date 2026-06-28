import { useState } from 'react';
import { TextField, Box, Grid, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchUsers } from '../api/users';
import { useDebounce } from '../general_hooks/useDebounce';
import UserCard from '../general_components/UserCard';
import Spinner from '../general_components/Spinner';

// Home-only user search: find a user and jump to their profile.
const UserSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  });

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', mt: 4, textAlign: 'left' }}>
      <TextField
        fullWidth
        placeholder="Search for a user..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />
      {isLoading && <Spinner />}
      {!isLoading && debouncedQuery.trim().length >= 2 && users.length === 0 && (
        <Alert severity="info">No users found for &ldquo;{debouncedQuery}&rdquo;</Alert>
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <UserCard user={user} onClick={() => navigate(`/users/${user.id}`)} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UserSearch;
