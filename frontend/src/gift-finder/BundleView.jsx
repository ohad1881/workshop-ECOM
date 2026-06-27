import { Box, Typography, LinearProgress, Chip, Grid, Paper, Stack, Alert } from '@mui/material';
import { formatCurrency } from '../utils/formatters';
import RecommendationCard from './RecommendationCard';
import Spinner from '../general_components/Spinner';

const BundleView = ({ bundle, strategy, isLoading, compareCount }) => {
  if (isLoading) return <Spinner />;

  if (!bundle) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No bundle data available.
      </Typography>
    );
  }

  const { items = [], total_price, total_score, budget_utilization } = bundle;
  const utilizationNum = parseFloat(budget_utilization);
  const isMaxItems = strategy?.value === 'max_items';
  const extraItems = compareCount != null ? items.length - compareCount : null;

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        {strategy && (
          <>
            <Typography variant="h6" sx={{ mb: 0.5 }}>{strategy.label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {strategy.description}
            </Typography>
          </>
        )}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Chip
            label={`${items.length} item${items.length !== 1 ? 's' : ''}`}
            size="small"
            color={isMaxItems ? 'success' : 'default'}
          />
          <Chip
            label={`Total: ${formatCurrency(total_price)}`}
            size="small"
            color="primary"
          />
          <Chip
            label={`Avg score: ${items.length > 0 ? Math.round((total_score / items.length) * 100) : 0}%`}
            size="small"
          />
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Budget utilization
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {budget_utilization}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(utilizationNum, 100)}
          color={utilizationNum >= 80 ? 'primary' : 'inherit'}
          sx={{ height: 8, borderRadius: 4, mb: 1 }}
        />

        {isMaxItems && extraItems != null && extraItems > 0 && (
          <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
            +{extraItems} more item{extraItems !== 1 ? 's' : ''} vs Best Match — lower-scored items
            (10–25%) included to fill your budget.
          </Alert>
        )}
      </Paper>

      {items.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No items fit within the budget for this strategy.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.product.id}>
              <RecommendationCard item={item} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default BundleView;
