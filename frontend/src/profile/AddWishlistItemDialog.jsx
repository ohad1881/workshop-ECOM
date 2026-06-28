import { useState } from 'react';
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
  Chip,
  Typography,
} from '@mui/material';
import { listProducts, searchProducts } from '../api/products';
import { useDebounce } from '../general_hooks/useDebounce';
import { formatCurrency } from '../utils/formatters';
import Spinner from '../general_components/Spinner';

const LIMIT = 20;

// Owner-only: show the first products on open, search the full catalog as you type.
const AddWishlistItemDialog = ({ open, onClose, onSelect, adding, existingProductIds = [] }) => {
  const [query, setQuery] = useState('');
  const term = useDebounce(query.trim(), 300);

  const { data, isFetching } = useQuery({
    queryKey: term ? ['products', 'search', term] : ['products', 'basic', LIMIT],
    queryFn: () => (term ? searchProducts(term) : listProducts({ limit: LIMIT })),
    enabled: open,
  });

  // search returns an array; list returns a paginated { results } envelope.
  const results = Array.isArray(data) ? data : data?.results ?? [];

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

        {!isFetching && results.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            {term ? `No products match “${term}”.` : 'No products available.'}
          </Typography>
        )}

        <List>
          {results.map((product) => {
            const alreadyAdded = existingProductIds.includes(product.id);
            return (
              <ListItemButton
                key={product.id}
                onClick={() => onSelect(product)}
                disabled={adding || alreadyAdded}
              >
                <ListItemText
                  primary={product.name}
                  secondary={formatCurrency(Number(product.price))}
                />
                {alreadyAdded && <Chip label="Already added" size="small" />}
              </ListItemButton>
            );
          })}
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
