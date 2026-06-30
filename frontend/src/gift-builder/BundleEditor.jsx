import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
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
import { getGiftSuggestions } from '../api/recommendations';

const BundleEditor = ({
  bundleItems,
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
  const safeBundleItems = Array.isArray(bundleItems) ? bundleItems : [];
  const [sortBy, setSortBy] = useState('match');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [minMatch, setMinMatch] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const recsQuery = useQuery({
    queryKey: ['bundle-editor-recs', recipient?.id, budget],
    queryFn: () => getGiftSuggestions(recipient.id, { budget, limit: 100 }),
    enabled: dialogOpen && !!recipient,
  });

  const currentTotal = useMemo(
    () => safeBundleItems.reduce((sum, item) => sum + Number(item.product?.price || 0), 0),
    [safeBundleItems],
  );
  const overBudget = currentTotal > budget;

  const visibleRecommendations = useMemo(() => {
    const items = Array.isArray(recsQuery.data?.recommendations) ? recsQuery.data.recommendations : [];
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
  }, [recsQuery.data?.recommendations, minMatch, priceRange, sortBy]);

  const handleOpenDialog = () => {
    setSortBy('match');
    setMinMatch(0);
    setPriceRange([0, 1000]);
    setDialogOpen(true);
  };

  const handleSelectProduct = (item) => {
    const product = item.product;
    const alreadyAdded = safeBundleItems.some((bundleItem) => bundleItem.product.id === product.id);
    if (alreadyAdded) {
      setSnackbarMessage(`${product.name} is already in your bundle.`);
      setSnackbarOpen(true);
      return;
    }

    onAddProduct(item);
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

      {safeBundleItems.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your bundle is empty. Use the Add Products button to add items.
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {safeBundleItems.map((item) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={item.product.id}>
              <RecommendationCard
                item={item}
                action={
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DeleteOutlinedIcon />}
                    onClick={() => onRemoveProduct(item.product.id)}
                    color="error"
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'error.light', color: 'white', borderColor: 'error.light' },
                    }}
                  >
                    Remove
                  </Button>
                }
              />
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
          disabled={safeBundleItems.length === 0}
          sx={{ borderRadius: '12px', textTransform: 'none' }}
        >
          Edit with AI chat
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
                const isInBundle = safeBundleItems.some((bundleItem) => bundleItem.product.id === product.id);
                return (
                  <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={product.id}>
                    <RecommendationCard
                      item={item}
                      action={
                        <Button
                          fullWidth
                          variant="contained"
                          disabled={isInBundle}
                          onClick={isInBundle ? undefined : () => handleSelectProduct(item)}
                          startIcon={<span style={{ fontSize: 14 }}>{isInBundle ? '✓' : '+'}</span>}
                          sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontFamily: 'DM Sans, sans-serif',
                            bgcolor: '#E87461',
                            '&:hover': { bgcolor: '#d96551' },
                            '&.Mui-disabled': { bgcolor: '#2A9D8F', color: 'white' },
                          }}
                        >
                          {isInBundle ? 'In Bundle' : 'Add'}
                        </Button>
                      }
                    />
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
