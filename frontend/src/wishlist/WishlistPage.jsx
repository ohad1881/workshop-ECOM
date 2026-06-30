import { useState, useRef } from 'react';
import {
  Box, Typography, Grid, Button, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyWishlist, addWishlistItem, removeWishlistItem } from '../api/wishlists';
import WishlistItem from './WishlistItem';
import AddWishlistItemDialog from '../profile/AddWishlistItemDialog';
import Spinner from '../general_components/Spinner';
import EmptyState from '../general_components/EmptyState';

const WishlistPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [undoItem, setUndoItem] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  // Clicking the trash icon asks for confirmation first. We keep `confirmItem`
  // set while the dialog fades out (cleared on exit) so its content doesn't
  // flash blank during the close animation.
  const requestDelete = (item) => {
    setConfirmItem(item);
    setConfirmOpen(true);
  };

  const performDelete = (item) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    queryClient.setQueryData(['wishlist'], (old = []) =>
      old.filter((i) => i.id !== item.id)
    );
    deleteMutation.mutate(item.id);

    setUndoItem(item);
    timerRef.current = setTimeout(() => setUndoItem(null), 5000);
  };

  const confirmDelete = () => {
    if (confirmItem) performDelete(confirmItem);
    setConfirmOpen(false);
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

  const handleAdd = (product) => {
    addMutation.mutate({ product_id: product.id, privacy: 'public', priority: 3 });
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
            <Grid size={{ xs: 12, md: 3 }} key={item.id}>
              <WishlistItem item={item} onDelete={requestDelete} />
            </Grid>
          ))}
        </Grid>
      )}

      <AddWishlistItemDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleAdd}
        adding={addMutation.isPending}
        existingProductIds={items.map((i) => i.product.id)}
      />

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        slotProps={{ transition: { onExited: () => setConfirmItem(null) } }}
      >
        <DialogTitle>Remove from wishlist?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to remove &ldquo;{confirmItem?.product?.name}&rdquo; from your wishlist?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
