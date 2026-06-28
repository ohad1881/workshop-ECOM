import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Divider,
  Stack,
  Alert,
  Dialog,
  Snackbar,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  IconButton,
  Popover,
  Slider,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import RecommendationCard from './RecommendationCard';
import { formatCurrency } from '../utils/formatters';
import Spinner from '../general_components/Spinner';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { getRecommendations } from '../api/recommendations';

const BundleEditor = ({
  bundleProducts,
  budget,
  bundleStrategy,
  recipient,
  onBack,
  onRemoveProduct,
  onAddProduct,
  onProceed,
}) => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const safeBundleProducts = Array.isArray(bundleProducts) ? bundleProducts : [];
  const [sortBy, setSortBy] = useState('match');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [minMatch, setMinMatch] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const recsQuery = useQuery({
    queryKey: ['bundle-editor-recs', recipient?.id, budget],
    queryFn: () => getRecommendations(recipient.id, { budget, limit: 100 }),
    enabled: dialogOpen && !!recipient,
  });

  const currentTotal = useMemo(
    () => safeBundleProducts.reduce((sum, product) => sum + Number(product.price || 0), 0),
    [safeBundleProducts],
  );
  const overBudget = currentTotal > budget;

  const visibleRecommendations = useMemo(() => {
    const items = Array.isArray(recsQuery.data) ? recsQuery.data : [];
    return items
      .filter((item) => {
        const score = (item.score ?? 0) * 100;
        const price = Number(item.product?.price ?? 0);
        return score >= minMatch && price >= priceRange[0] && price <= priceRange[1];
      })
      .sort((a, b) => {
        if (sortBy === 'price') return Number(a.product.price) - Number(b.product.price);
        if (sortBy === 'balanced') return (b.score * 800 + 200) - (a.score * 800 + 200);
        return b.score - a.score;
      });
  }, [recsQuery.data, minMatch, priceRange, sortBy]);

  const handleOpenDialog = () => {
    setSortBy('match');
    setMinMatch(0);
    setPriceRange([0, 1000]);
    setDialogOpen(true);
  };

  const handleSelectProduct = (product) => {
    const alreadyAdded = safeBundleProducts.some((item) => item.id === product.id);
    if (alreadyAdded) {
      setSnackbarMessage(`${product.name} is already in your bundle.`);
      setSnackbarOpen(true);
      return;
    }

    onAddProduct(product);
    setSnackbarMessage(`${product.name} added to your bundle.`);
    setSnackbarOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Customize Your Gift Bundle</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DeleteOutlinedIcon />}
            onClick={onBack}
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlinedIcon />}
            onClick={handleOpenDialog}
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            Add Products
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {bundleStrategy
          ? `Editing your ${bundleStrategy} bundle. Remove items or add new products to customize your final selection.`
          : 'Edit the bundle items and adjust the gift to stay within your budget.'}
      </Typography>

      {safeBundleProducts.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your bundle is empty. Use the Add Products button to add items.
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {safeBundleProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card sx={{ borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {product.image_url ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={product.image_url}
                    alt={product.name}
                  />
                ) : (
                  <Box sx={{ height: 140, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No image</Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }} noWrap>
                    {product.name}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {formatCurrency(product.price)}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DeleteOutlinedIcon />}
                      onClick={() => onRemoveProduct(product.id)}
                      sx={{ borderRadius: '12px', textTransform: 'none' }}
                    >
                      Remove
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider', mb: 3, backgroundColor: 'grey.50' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Bundle Totals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Budget: {formatCurrency(budget)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: overBudget ? theme.palette.error.main : '#2A9D8F' }}
            >
              Total: {formatCurrency(currentTotal)}
            </Typography>
            {overBudget ? (
              <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                Over budget by {formatCurrency(currentTotal - budget)}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: '#2A9D8F' }}>
                Within budget
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Button
          variant="contained"
          onClick={onProceed}
          disabled={safeBundleProducts.length === 0}
          sx={{ borderRadius: '12px', textTransform: 'none' }}
        >
          Proceed to AI Chat
        </Button>
        <Button variant="outlined" sx={{ borderRadius: '12px', textTransform: 'none' }}>
          Save Selection
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Review your final bundle and proceed when you&apos;re happy with the selection.
      </Typography>

      <Dialog fullWidth maxWidth="lg" open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Products
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="sort-label">Sort</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                label="Sort"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="match">Match</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="balanced">Balanced</MenuItem>
              </Select>
            </FormControl>
            <IconButton size="small" onClick={(e) => setFilterAnchor(e.currentTarget)}>
              <FilterListIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {recsQuery.isLoading ? <Spinner /> : visibleRecommendations.length === 0 ? (
            <Alert severity="info">No recommendations match the current filters.</Alert>
          ) : (
            <Grid container spacing={2}>
              {visibleRecommendations.map((item) => {
                const product = item.product;
                const isInBundle = safeBundleProducts.some((bundleItem) => bundleItem.id === product.id);
                return (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Card sx={{ borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <RecommendationCard item={item} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pb: 2, pt: 1.5, gap: 1 }}>
                        <Box sx={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                          {isInBundle ? (
                            <Chip
                              label="In Bundle"
                              size="small"
                              icon={<span style={{ fontSize: 12 }}>✓</span>}
                              sx={{ height: '40px', px: 1.5, borderRadius: '12px', bgcolor: '#2A9D8F', color: 'white', fontFamily: 'DM Sans, sans-serif' }}
                            />
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleSelectProduct(product)}
                              startIcon={<span style={{ fontSize: 14 }}>+</span>}
                              sx={{ height: '40px', px: 2, borderRadius: '12px', textTransform: 'none', bgcolor: '#E87461', '&:hover': { bgcolor: '#d96551' }, fontFamily: 'DM Sans, sans-serif' }}
                            >
                              Add
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '12px' }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Filters</Typography>
          <Typography variant="caption">Minimum match (%)</Typography>
          <Slider value={minMatch} onChange={(_, v) => setMinMatch(v)} aria-label="minMatch" valueLabelDisplay="auto" />
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption">Price range</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField size="small" type="number" label="Min" value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} sx={{ width: 100 }} />
            <TextField size="small" type="number" label="Max" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} sx={{ width: 100 }} />
          </Box>
        </Box>
      </Popover>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1800}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ borderRadius: '12px' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BundleEditor;
