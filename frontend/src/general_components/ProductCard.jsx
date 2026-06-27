import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { formatCurrency } from '../utils/formatters';

const ProductCard = ({ product, action }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    {product.image_url ? (
      <CardMedia component="img" height="140" image={product.image_url} alt={product.name} />
    ) : (
      <Box sx={{ height: 140, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">No image</Typography>
      </Box>
    )}
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography variant="subtitle1" fontWeight={600} noWrap>{product.name}</Typography>
      <Typography variant="body2" color="primary" fontWeight={600}>
        {formatCurrency(product.price)}
      </Typography>
    </CardContent>
    {action && <Box sx={{ px: 2, pb: 2 }}>{action}</Box>}
  </Card>
);

export default ProductCard;
