import { Typography } from '@mui/material';

// Purple-to-gold gradient heading used for every top-level page title (Products,
// My Wishlist, Gift History, Build a Gift, ...). Home has its own hero treatment
// and doesn't use this.
const PageTitle = ({ children, sx, ...props }) => (
  <Typography
    variant="h3"
    sx={{
      mb: 3,
      background: 'linear-gradient(90deg, #F3F1F8 0%, #F5A623 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      display: 'inline-block',
      ...sx,
    }}
    {...props}
  >
    {children}
  </Typography>
);

export default PageTitle;
