import { Box, Typography } from '@mui/material';

// Placeholder for empty lists / no-data states. Optional `action` (e.g. a Button).
const EmptyState = ({ title = 'Nothing here yet', description, action }) => (
  <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
    <Typography variant="h4" sx={{ mb: 1 }}>
      {title}
    </Typography>
    {description && (
      <Typography variant="body1" sx={{ mb: 3 }}>
        {description}
      </Typography>
    )}
    {action}
  </Box>
);

export default EmptyState;
