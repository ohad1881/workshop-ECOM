import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Button, Chip, Box, CircularProgress, Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { searchProducts } from '../api/products';
import { useDebounce } from '../general_hooks/useDebounce';
import { formatCurrency } from '../utils/formatters';

const AddToWishlistModal = ({ open, onClose, existingProductIds, onAdd }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['products', 'search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  });

  const handleAdd = (productId) => {
    onAdd(productId);
    onClose();
    setQuery('');
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add to Wishlist</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
        />
        {isFetching && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!isFetching && debouncedQuery.trim().length > 0 && results.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No products found for &ldquo;{debouncedQuery}&rdquo;
          </Typography>
        )}
        {!isFetching && debouncedQuery.trim().length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Type to search the product catalog
          </Typography>
        )}
        <List disablePadding>
          {results.map((product) => {
            const alreadyAdded = existingProductIds.includes(product.id);
            return (
              <ListItem key={product.id} divider>
                <ListItemText
                  primary={product.name}
                  secondary={formatCurrency(product.price)}
                />
                <ListItemSecondaryAction>
                  {alreadyAdded ? (
                    <Chip label="Already added" size="small" color="default" />
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleAdd(product.id)}
                    >
                      Add
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default AddToWishlistModal;
