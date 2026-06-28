import {
  Avatar,
  Box,
  IconButton,
  Paper,
  Rating,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { formatCurrency } from '../utils/formatters';
import { resolveMediaUrl } from '../utils/media';

// One wishlist item. Owner sees editable want (1–5), privacy toggle and delete;
// otherwise it's read-only (and the API only ever sends public items to others).
const WishlistItemRow = ({ item, isOwner, onWant, onPrivacy, onDelete }) => {
  const { product, privacy, priority, note } = item;

  return (
    <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar
        variant="rounded"
        src={resolveMediaUrl(product.image_url)}
        sx={{ width: 56, height: 56, bgcolor: 'divider', color: 'text.secondary' }}
      >
        {product.name?.charAt(0)?.toUpperCase()}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {formatCurrency(Number(product.price))}
        </Typography>
        {note && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            “{note}”
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
        <Tooltip title={isOwner ? 'How much you want this (1–5)' : `Wanted ${priority || 0}/5`}>
          <span>
            <Rating
              max={5}
              value={priority || 0}
              readOnly={!isOwner}
              onChange={(_e, value) => onWant?.(item, value)}
            />
          </span>
        </Tooltip>

        {isOwner && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={privacy}
              onChange={(_e, value) => value && onPrivacy?.(item, value)}
            >
              <ToggleButton value="public" aria-label="public">
                <Tooltip title="Public">
                  <PublicIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="private" aria-label="private">
                <Tooltip title="Private">
                  <LockIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton color="error" onClick={() => onDelete?.(item)} aria-label="remove">
              <DeleteOutlineIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default WishlistItemRow;
