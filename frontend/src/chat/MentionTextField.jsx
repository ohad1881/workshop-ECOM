import {
  TextField, Popper, Paper, List, ListItemButton, ListItemText,
  ListItemAvatar, Avatar, Typography, ClickAwayListener,
} from '@mui/material';
import { gravatarUrl } from '../utils/gravatar';
import { formatCurrency } from '../utils/formatters';
import { avatarColorFor } from '../utils/avatarColor';

// A text input wired to useMentions: renders an anchored dropdown of @user / #product
// matches. `mentions` is the object returned by useMentions(); extra props pass to TextField.
const MentionTextField = ({ mentions, onKeyDown, ...textFieldProps }) => {
  const { value, onChange, onSelect, closeMenu, inputRef, anchorEl, open, items, trigger, insert } = mentions;

  return (
    <>
      <TextField
        value={value}
        onChange={onChange}
        onSelect={onSelect}
        onKeyDown={onKeyDown}
        inputRef={inputRef}
        {...textFieldProps}
      />
      <Popper
        open={open && items.length > 0}
        anchorEl={anchorEl}
        placement="top-start"
        style={{ zIndex: 1400, width: anchorEl?.offsetWidth }}
      >
        <ClickAwayListener onClickAway={closeMenu}>
          <Paper elevation={4} sx={{ maxHeight: 240, overflow: 'auto', mb: 0.5 }}>
            <List dense disablePadding>
              {items.map((item) => (
                <ListItemButton key={item.id} onMouseDown={(e) => { e.preventDefault(); insert(item); }}>
                  {trigger === '@' && (
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar
                        src={gravatarUrl(item.gravatar_hash, { size: 48 })}
                        sx={{ width: 28, height: 28, bgcolor: avatarColorFor(item.username) }}
                      >
                        {item.username?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    primary={trigger === '@' ? item.username : item.name}
                    secondary={trigger === '#' ? formatCurrency(item.price) : undefined}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
      {open && items.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          Searching {trigger === '@' ? 'users' : 'products'}…
        </Typography>
      )}
    </>
  );
};

export default MentionTextField;
