import { useState, useRef } from 'react';
import {
  Box, Typography, Grid, Button, Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyWishlist, addWishlistItem, removeWishlistItem } from '../api/wishlists';
import WishlistItem from './WishlistItem';
import AddToWishlistModal from './AddToWishlistModal';
import Spinner from '../general_components/Spinner';
import EmptyState from '../general_components/EmptyState';

const WishlistPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [undoItem, setUndoItem] = useState(null);
  const timerRef = useRef(null);

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getMyWishlist,
  });

  const addMutation = useMutation({
    mutationFn: addWishlistItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => removeWishlistItem(id),
  });

  const handleDelete = (item) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    queryClient.setQueryData(['wishlist'], (old = []) =>
      old.filter((i) => i.id !== item.id)
    );
    deleteMutation.mutate(item.id);

    setUndoItem(item);
    timerRef.current = setTimeout(() => setUndoItem(null), 5000);
  };

  const handleUndo = () => {
    if (!undoItem) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    addMutation.mutate({
      product_id: undoItem.product.id,
      privacy: undoItem.privacy,
      priority: undoItem.priority,
      note: undoItem.note,
    });
    setUndoItem(null);
  };

  const handleAdd = (productId) => {
    addMutation.mutate({ product_id: productId, priority: 5 });
  };

  if (isLoading) return <Spinner fullHeight />;
  if (error) return <EmptyState title="Error loading wishlist" description={error.message} />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">My Wishlist</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
          Add Item
        </Button>
      </Box>

      {items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Search the product catalog to add items you want."
          action={
            <Button variant="contained" onClick={() => setModalOpen(true)}>
              Add First Item
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <WishlistItem item={item} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      )}

      <AddToWishlistModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        existingProductIds={items.map((i) => i.product.id)}
        onAdd={handleAdd}
      />

      <Snackbar
        open={!!undoItem}
        message={`"${undoItem?.product?.name}" removed`}
        action={
          <Button color="primary" size="small" onClick={handleUndo}>
            UNDO
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default WishlistPage;
