import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { formatCurrency } from '../utils/formatters';

// Compact one-line product row for the chat panel, where vertical space is tight and a
// bundle can hold 5+ items. The full vertical card lives in gift-builder/RecommendationCard.
const BundleItemRow = ({ item }) => {
  const { product, score, explanation } = item;
  const scorePercent = Math.round((score ?? 0) * 100);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
      {product.image_url ? (
        <Box
          component="img"
          src={product.image_url}
          alt={product.name}
          sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <Box sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: 'grey.100', flexShrink: 0 }} />
      )}
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" fontWeight={600} noWrap>{product.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {formatCurrency(product.price)} · {scorePercent}% match
        </Typography>
      </Box>
      <Tooltip title={explanation || 'No explanation available'} arrow>
        <IconButton size="small" sx={{ p: 0.25 }}>
          <InfoOutlinedIcon sx={{ fontSize: 16 }} color="action" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default BundleItemRow;
