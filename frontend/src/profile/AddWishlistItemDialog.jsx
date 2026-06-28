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
  Box,
  Typography,
} from '@mui/material';
import { searchProducts } from '../api/products';
import { formatCurrency } from '../utils/formatters';
import Spinner from '../general_components/Spinner';

// Owner-only: search the catalog and pick a product to add to the wishlist.
const AddWishlistItemDialog = ({ open, onClose, onSelect, adding }) => {
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');

  // Debounce the search term so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['product-search', term],
    queryFn: () => searchProducts(term),
    enabled: open && term.length >= 2,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add to wishlist</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          disabled={adding}
        />

        {isFetching && <Spinner />}

        {!isFetching && term.length >= 2 && results.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            No products match “{term}”.
          </Typography>
        )}

        {!isFetching && term.length < 2 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            Type at least 2 characters to search.
          </Typography>
        )}

        <List>
          {results.map((product) => (
            <ListItemButton
              key={product.id}
              onClick={() => onSelect(product)}
              disabled={adding}
            >
              <ListItemText
                primary={product.name}
                secondary={formatCurrency(Number(product.price))}
              />
            </ListItemButton>
          ))}
        </List>

        {adding && (
          <Box sx={{ py: 1 }}>
            <Spinner />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddWishlistItemDialog;
