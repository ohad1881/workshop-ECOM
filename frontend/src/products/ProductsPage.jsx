import { useState } from 'react';
import { useAtom } from 'jotai';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { listProducts } from '../api/products';
import { getCategories } from '../api/taxonomy';
import { getRecommendedForMe } from '../api/recommendations';
import { getMyWishlist, addWishlistItem, removeWishlistItem } from '../api/wishlists';
import { resolveMediaUrl } from '../utils/media';
import { showWishlistItemsAtom } from './productAtoms';

// 0–1 match score → a color for the "% match" badge.
const scoreColor = (score) => {
  if (score >= 0.6) return 'success';
  if (score >= 0.35) return 'primary';
  if (score >= 0.15) return 'warning';
  if (score < 0.15) return 'secondary';
  return 'default';
};

const ProductCard = ({ product, score, explanation, wishlistItemId, onAdd, onRemove, isMutating }) => {
  const inWishlist = wishlistItemId != null;
  const hasScore = typeof score === 'number';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {hasScore && (
        <Tooltip title={explanation || ''}>
          <Chip
            label={`${Math.round(score * 100)}% match`}
            color={scoreColor(score)}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
              fontWeight: 600,
              cursor: 'help',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: 1,
              '&:hover': {
                transform: 'scale(1.08)',
                boxShadow: 3,
              },
            }}
          />
        </Tooltip>
      )}
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

const RECOMMENDED = 'recommended';

const ProductsPage = () => {
  const [search, setSearch] = useState('');
  // Default view is the personalized "Recommended" feed; category ids switch to plain catalog.
  const [categoryId, setCategoryId] = useState(RECOMMENDED);
  const [mutatingIds, setMutatingIds] = useState(new Set());
  // Persisted "Show in Wishlist" toggle — defaults to false (wishlist items hidden).
  const [showWishlistItems, setShowWishlistItems] = useAtom(showWishlistItemsAtom);
  const queryClient = useQueryClient();

  const isRecommended = categoryId === RECOMMENDED;

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ limit: 50 }),
  });
  const categories = categoriesData?.results ?? [];

  // Personalized feed: whole catalog scored against the user's profile, pre-sorted.
  const recQuery = useQuery({
    queryKey: ['recommended-products'],
    queryFn: () => getRecommendedForMe({ limit: 500 }),
    enabled: isRecommended,
  });

  // Plain catalog list for a specific category (paginated, server-side search).
  const catalogQuery = useInfiniteQuery({
    queryKey: ['products', search, categoryId],
    queryFn: ({ pageParam = 1 }) =>
      listProducts({ search, category_id: categoryId, limit: 100, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
    initialPageParam: 1,
    enabled: !isRecommended,
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

  // Normalize both modes into one { product, score?, explanation? } list.
  let entries;
  let isLoading;
  let isError;
  if (isRecommended) {
    isLoading = recQuery.isLoading;
    isError = recQuery.isError;
    const term = search.trim().toLowerCase();
    entries = (recQuery.data?.results ?? [])
      .map((r) => ({ product: r.product, score: r.score, explanation: r.explanation }))
      .filter((e) => !term || e.product.name.toLowerCase().includes(term));
  } else {
    isLoading = catalogQuery.isLoading;
    isError = catalogQuery.isError;
    entries = (catalogQuery.data?.pages.flatMap((p) => p.results) ?? []).map((product) => ({ product }));
  }

  // "Show in Wishlist" toggle: when OFF (default), hide products already on the
  // user's wishlist; when ON, include them.
  if (!showWishlistItems) {
    entries = entries.filter((e) => wishlistMap[e.product.id] == null);
  }

  const recMessage = isRecommended ? recQuery.data?.message : null;

  return (
    <Box sx={{ width: '100%', mx: 'auto', px: 3, py: 4 }}>
      <Typography variant="h2" sx={{ mb: 3 }}>Products</Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        <Tooltip title="Show items in wishlist">
          <ToggleButton
            value="wishlist"
            selected={showWishlistItems}
            onChange={() => setShowWishlistItems((v) => !v)}
            size="small"
            color="error"
            aria-label="Show included in wishlist items"
            sx={{ borderRadius: '50% !important', p: 0.75, flexShrink: 0 }}
          >
            {showWishlistItems ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
          </ToggleButton>
        </Tooltip>
      </Box>

      {categories.length > 0 && (
        <ToggleButtonGroup
          value={categoryId}
          exclusive
          onChange={(_, val) => val !== null && setCategoryId(val)}
          sx={{ mb: 4, flexWrap: 'wrap', gap: 0.5 }}
        >
          <ToggleButton value={RECOMMENDED} sx={{ borderRadius: '20px !important', px: 2 }}>
            ⭐ Recommended
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

      {!isLoading && recMessage && entries.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {recMessage} Add interests, preferred categories, or wishlist items to your profile to get
          personalized picks.
        </Alert>
      )}

      {!isLoading && !isError && !recMessage && entries.length === 0 && (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
          No products found.
        </Typography>
      )}

      <Box
        sx={{
          display: 'grid',
          // Fit columns to the actual available width (not the viewport), so the
          // grid reflows correctly when the chat drawer shifts the page left.
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 3,
        }}
      >
        {entries.map(({ product, score, explanation }) => (
          <Box key={product.id}>
            <ProductCard
              product={product}
              score={score}
              explanation={explanation}
              wishlistItemId={wishlistMap[product.id]}
              isMutating={mutatingIds.has(product.id)}
              onAdd={(productId) => addMutation.mutate(productId)}
              onRemove={(itemId) => removeMutation.mutate({ itemId, productId: product.id })}
            />
          </Box>
        ))}
      </Box>

      {!isRecommended && catalogQuery.hasNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => catalogQuery.fetchNextPage()}
            disabled={catalogQuery.isFetchingNextPage}
            startIcon={catalogQuery.isFetchingNextPage ? <CircularProgress size={16} /> : null}
          >
            {catalogQuery.isFetchingNextPage ? 'Loading…' : 'Show More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProductsPage;
