import {
  Card, CardContent, CardMedia, Box, Typography,
  Rating, Switch, FormControlLabel, IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWishlistItem } from '../api/wishlists';
import { formatCurrency } from '../utils/formatters';

const WishlistItem = ({ item, onDelete }) => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => updateWishlistItem(item.id, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      const prev = queryClient.getQueryData(['wishlist']);
      queryClient.setQueryData(['wishlist'], (old) =>
        old.map((i) => (i.id === item.id ? { ...i, ...data } : i))
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      queryClient.setQueryData(['wishlist'], ctx.prev);
    },
  });

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {item.product.image_url ? (
        <CardMedia
          component="img"
          height="140"
          image={item.product.image_url}
          alt={item.product.name}
        />
      ) : (
        <Box sx={{ height: 140, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">No image</Typography>
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
          {item.product.name}
        </Typography>
        <Typography variant="body2" color="primary" fontWeight={600} sx={{ mb: 1 }}>
          {formatCurrency(item.product.price)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Priority
        </Typography>
        <Rating
          value={item.priority}
          onChange={(_, newValue) =>
            updateMutation.mutate({ priority: newValue ?? 0 })
          }
          sx={{ mb: 1 }}
        />
      </CardContent>
      <Box sx={{ px: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Switch
              checked={item.privacy === 'public'}
              onChange={(e) =>
                updateMutation.mutate({ privacy: e.target.checked ? 'public' : 'private' })
              }
              size="small"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {item.privacy === 'private' && <LockIcon sx={{ fontSize: 12 }} />}
              <Typography variant="caption">
                {item.privacy === 'public' ? 'Public' : 'Private'}
              </Typography>
            </Box>
          }
        />
        <IconButton size="small" color="error" onClick={() => onDelete(item)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Card>
  );
};

export default WishlistItem;
