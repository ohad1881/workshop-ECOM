import { Box, Chip, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

// A wishlist-style section of category chips. Owner can remove (chip delete) and
// add (the "+ Add" chip). Read-only otherwise; hidden when empty for non-owners.
const PreferenceSection = ({ title, icon, ids, nameMap, privacy, isOwner, onAdd, onRemove }) => {
  if (!isOwner && (!ids || ids.length === 0)) return null;
  const list = ids || [];

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}
      >
        {icon}
        {title}
        {isOwner && privacy && (
          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
            {privacy === 'private' ? <LockIcon fontSize="inherit" /> : <PublicIcon fontSize="inherit" />}
            {privacy}
          </Typography>
        )}
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {list.map((id) => {
          const cat = nameMap.get(id);
          const label = cat ? `${cat.icon ? `${cat.icon} ` : ''}${cat.name}` : `#${id}`;
          return (
            <Chip
              key={id}
              label={label}
              onDelete={isOwner ? () => onRemove(id) : undefined}
            />
          );
        })}

        {isOwner && (
          <Chip
            icon={<AddIcon />}
            label="Add"
            variant="outlined"
            onClick={onAdd}
            sx={{ borderStyle: 'dashed' }}
          />
        )}

        {!isOwner && list.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            None yet.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default PreferenceSection;
