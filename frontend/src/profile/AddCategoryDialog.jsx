import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { getCategories } from '../api/taxonomy';
import Spinner from '../general_components/Spinner';

// Owner-only: search categories to add to a preference list. Already-selected
// categories are filtered out.
const AddCategoryDialog = ({ open, onClose, onSelect, excludeIds = [], saving }) => {
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ['categories', 'search', term],
    queryFn: () => getCategories(term ? { q: term, limit: 20 } : { limit: 50 }),
    enabled: open,
  });

  const results = (data?.results ?? data ?? []).filter((c) => !excludeIds.includes(c.id));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add category</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          placeholder="Search categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          disabled={saving}
        />

        {isFetching && <Spinner />}

        {!isFetching && results.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            No categories to add.
          </Typography>
        )}

        <List>
          {results.map((category) => (
            <ListItemButton
              key={category.id}
              onClick={() => onSelect(category)}
              disabled={saving}
            >
              <ListItemText primary={`${category.icon ? `${category.icon} ` : ''}${category.name}`} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
