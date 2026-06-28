import { useState } from 'react';
import { Avatar, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { formatDate } from '../utils/formatters';

const BIO_MAX = 500;

// Identity block: avatar (centered above the text), name, member-since and bio.
// Category preferences live in the main column (see ProfileView).
const ProfileSidebar = ({ profile, isOwner, profileEdit, onNotify }) => {
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(profile.bio || '');

  const startEditingBio = () => {
    setBioDraft(profile.bio || '');
    setEditingBio(true);
  };

  const saveBio = () => {
    profileEdit.bio.mutate(bioDraft, {
      onSuccess: () => {
        setEditingBio(false);
        onNotify?.('Bio updated');
      },
      onError: () => onNotify?.('Could not save bio', 'error'),
    });
  };

  return (
    <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', alignItems: 'center' }}>
      <Avatar
        src={profile.avatarUrl}
        sx={{ width: 160, height: 160, fontSize: '3rem', bgcolor: 'primary.main', mx: 'auto' }}
      >
        {profile.username?.charAt(0)?.toUpperCase()}
      </Avatar>

      <Box>
        <Typography variant="h4">{profile.username}</Typography>
        {profile.dateJoined && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Member since {formatDate(profile.dateJoined)}
          </Typography>
        )}
      </Box>

      {/* Bio */}
      <Box sx={{ width: '100%' }}>
        {editingBio ? (
          <Stack spacing={1}>
            <TextField
              multiline
              minRows={3}
              fullWidth
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              inputProps={{ maxLength: BIO_MAX }}
              helperText={`${bioDraft.length}/${BIO_MAX}`}
            />
            <Stack direction="row" spacing={1} justifyContent="center">
              <Button size="small" onClick={() => setEditingBio(false)}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={saveBio}
                disabled={profileEdit.bio.isPending}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack direction="row" spacing={0.5} alignItems="flex-start" justifyContent="center">
            <Typography
              variant="body1"
              sx={{ color: profile.bio ? 'text.primary' : 'text.secondary' }}
            >
              {profile.bio || (isOwner ? 'Add a bio to tell people about yourself.' : 'No bio yet.')}
            </Typography>
            {isOwner && (
              <IconButton size="small" onClick={startEditingBio} aria-label="edit bio">
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

export default ProfileSidebar;
