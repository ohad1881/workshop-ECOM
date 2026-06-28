import { useState } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { listProducts } from '../api/products';
import { getCategories } from '../api/taxonomy';
import { getMyWishlist, addWishlistItem, removeWishlistItem } from '../api/wishlists';
import { resolveMediaUrl } from '../utils/media';

const ProductCard = ({ product, wishlistItemId, onAdd, onRemove, isMutating }) => {
  const inWishlist = wishlistItemId != null;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {product.image_url && (
        <CardMedia
          component="img"
          height="180"
          image={resolveMediaUrl(product.image_url)}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom noWrap>
          {product.name}
        </Typography>
        <Typography variant="body1" color="primary" fontWeight={600}>
          ${Number(product.price).toFixed(2)}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Tooltip title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
          <span style={{ width: '100%' }}>
            <Button
              fullWidth
              size="small"
              variant={inWishlist ? 'contained' : 'outlined'}
              color={inWishlist ? 'error' : 'primary'}
              startIcon={isMutating ? <CircularProgress size={14} /> : inWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              disabled={isMutating}
              onClick={() => inWishlist ? onRemove(wishlistItemId) : onAdd(product.id)}
            >
              {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </Button>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

const ProductsPage = () => {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [mutatingIds, setMutatingIds] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ limit: 50 }),
  });
  const categories = categoriesData?.results ?? [];

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['products', search, categoryId],
    queryFn: ({ pageParam = 1 }) =>
      listProducts({ search, category_id: categoryId, limit: 100, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
    initialPageParam: 1,
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getMyWishlist,
  });

  const wishlistMap = {};
  const wishlistItems = wishlistData?.results ?? wishlistData ?? [];
  for (const item of wishlistItems) {
    wishlistMap[item.product_id ?? item.product?.id] = item.id;
  }

  const addMutation = useMutation({
    mutationFn: (productId) => addWishlistItem({ product_id: productId, privacy: 'public', priority: 5, note: '' }),
    onMutate: (productId) => setMutatingIds((s) => new Set(s).add(productId)),
    onSettled: (_, __, productId) => {
      setMutatingIds((s) => { const n = new Set(s); n.delete(productId); return n; });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ itemId }) => removeWishlistItem(itemId),
    onMutate: ({ productId }) => setMutatingIds((s) => new Set(s).add(productId)),
    onSettled: (_, __, { productId }) => {
      setMutatingIds((s) => { const n = new Set(s); n.delete(productId); return n; });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const products = data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 4 }}>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Products
      </Typography>

      <TextField
        fullWidth
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {categories.length > 0 && (
        <ToggleButtonGroup
          value={categoryId}
          exclusive
          onChange={(_, val) => setCategoryId(val)}
          sx={{ mb: 4, flexWrap: 'wrap', gap: 0.5 }}
        >
          <ToggleButton value={null} sx={{ borderRadius: '20px !important', px: 2 }}>
            All
          </ToggleButton>
          {categories.map((cat) => (
            <ToggleButton key={cat.id} value={cat.id} sx={{ borderRadius: '20px !important', px: 2 }}>
              {cat.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">Failed to load products. Please try again.</Alert>
      )}

      {!isLoading && !isError && products.length === 0 && (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
          No products found.
        </Typography>
      )}

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <ProductCard
              product={product}
              wishlistItemId={wishlistMap[product.id]}
              isMutating={mutatingIds.has(product.id)}
              onAdd={(productId) => addMutation.mutate(productId)}
              onRemove={(itemId) => removeMutation.mutate({ itemId, productId: product.id })}
            />
          </Grid>
        ))}
      </Grid>

      {hasNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            startIcon={isFetchingNextPage ? <CircularProgress size={16} /> : null}
          >
            {isFetchingNextPage ? 'Loading…' : 'Show More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProductsPage;
