import {
  Card, CardContent, CardMedia, Box, Typography,
  LinearProgress, Tooltip, IconButton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { formatCurrency } from '../utils/formatters';

const RecommendationCard = ({ item, action, actionSx }) => {
  const { product, score, explanation } = item;
  const scorePercent = Math.round(score * 100);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {product.image_url ? (
        <CardMedia
          component="img"
          image={product.image_url}
          alt={product.name}
          sx={{ height: 140, objectFit: 'cover' }}
        />
      ) : (
        <Box sx={{ height: 140, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">No image</Typography>
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
          {product.name}
        </Typography>
        <Typography variant="body2" color="secondary" fontWeight={600} sx={{ mb: 1.5 }}>
          {formatCurrency(product.price)}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
            Match
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={scorePercent}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
          <Typography variant="caption" fontWeight={700}>{scorePercent}%</Typography>
          <Tooltip title={explanation || 'No explanation available'} arrow>
            <IconButton size="small" sx={{ p: 0.25 }}>
              <InfoOutlinedIcon sx={{ fontSize: 16 }} color="action" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
      {action && (
        <Box sx={{ px: 2, pb: 2, pt: 0.5, ...actionSx }}>
          {action}
        </Box>
      )}
    </Card>
  );
};

export default RecommendationCard;
