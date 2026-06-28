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
import { getCategories, getTags } from '../api/taxonomy';
import Spinner from '../general_components/Spinner';

// Owner-only search to add an item to a preference list. `source` picks the
// taxonomy: categories (preferred/disliked) or tags (interests). Already-selected
// items are filtered out via excludeIds.
const SOURCES = {
  categories: { fetch: getCategories, title: 'Add category', placeholder: 'Search categories…', empty: 'No categories to add.' },
  tags: { fetch: getTags, title: 'Add tag', placeholder: 'Search tags…', empty: 'No tags to add.' },
};

const AddPreferenceDialog = ({ open, onClose, onSelect, source = 'categories', excludeIds = [], saving }) => {
  const cfg = SOURCES[source] ?? SOURCES.categories;
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: [source, 'search', term],
    queryFn: () => cfg.fetch(term ? { q: term, limit: 20 } : { limit: 50 }),
    enabled: open,
  });

  const results = (data?.results ?? data ?? []).filter((item) => !excludeIds.includes(item.id));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{cfg.title}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          placeholder={cfg.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          disabled={saving}
        />

        {isFetching && <Spinner />}

        {!isFetching && results.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            {cfg.empty}
          </Typography>
        )}

        <List>
          {results.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => onSelect(item)}
              disabled={saving}
            >
              <ListItemText primary={`${item.icon ? `${item.icon} ` : ''}${item.name}`} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default AddPreferenceDialog;
