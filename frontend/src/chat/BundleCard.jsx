import { useState } from 'react';
import { Box, Paper, Typography, Button, Stack, Divider } from '@mui/material';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BundleItemRow from './BundleItemRow';
import CustomSnackbar from '../general_components/CustomSnackbar';
import { formatCurrency } from '../utils/formatters';

// Renders a single proposed bundle (items + budget summary). Save is intentionally a
// stub — it will surface the bundle in the future "Build a Gift" page (not built yet).
const BundleCard = ({ bundle }) => {
  const [savedHint, setSavedHint] = useState(false);
  const items = bundle?.items || [];
  if (items.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: 'chatSurface' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Gift bundle · {formatCurrency(bundle.total_price)}
          {bundle.budget_utilization ? ` (${bundle.budget_utilization} of budget)` : ''}
        </Typography>
        <Button
          size="small"
          startIcon={<BookmarkAddOutlinedIcon />}
          onClick={() => setSavedHint(true)}
        >
          Save
        </Button>
      </Box>
      <Stack divider={<Divider flexItem />}>
        {items.map((item) => (
          <BundleItemRow key={item.product.id} item={item} />
        ))}
      </Stack>
      <CustomSnackbar
        open={savedHint}
        message="Saving bundles to Build a Gift is coming soon."
        severity="info"
        onClose={() => setSavedHint(false)}
      />
    </Paper>
  );
};

export default BundleCard;
