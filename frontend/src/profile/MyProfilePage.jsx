import { useState, useRef } from 'react';
import {
  Box, Typography, Avatar, Button, TextField, Chip, Stack,
  Switch, FormControlLabel, IconButton, Alert, Divider,
  Autocomplete, CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useMutation, useQuery } from '@tanstack/react-query';
import { updatePreferences, updateSettings, getCurrentUser } from '../api/auth';
import { getCategories } from '../api/taxonomy';
import { useAuth } from '../context/auth/useAuth';
import Spinner from '../general_components/Spinner';

const SectionHeader = ({ title, onEdit, editing }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
    <Typography variant="h6">{title}</Typography>
    {!editing && (
      <IconButton size="small" onClick={onEdit}>
        <EditIcon fontSize="small" />
      </IconButton>
    )}
  </Box>
);

const MyProfilePage = () => {
  const { user, setUser } = useAuth();
  const avatarInputRef = useRef(null);

  const [strangerView, setStrangerView] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');
  const [editingInterests, setEditingInterests] = useState(false);
  const [interestDraft, setInterestDraft] = useState([]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ limit: 100 }),
  });
  const categories = categoriesData?.results ?? [];

  const refreshUser = async () => {
    const updated = await getCurrentUser();
    setUser(updated);
    return updated;
  };

  const prefsMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: refreshUser,
  });

  const settingsMutation = useMutation({
    mutationFn: (data) => updateSettings(data),
    onSuccess: refreshUser,
  });

  if (!user) return <Spinner fullHeight />;

  const prefs = user.preferences ?? {};

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const visibleInterests = strangerView && prefs.interests_privacy === 'private'
    ? []
    : prefs.interest_ids ?? [];

  const visiblePrefs = strangerView && prefs.preferences_privacy === 'private'
    ? { preferred: [], excluded: [] }
    : {
        preferred: prefs.preferred_category_ids ?? [],
        excluded: prefs.excluded_category_ids ?? [],
      };

  const handleBioEdit = () => {
    setBioValue(prefs.bio ?? '');
    setEditingBio(true);
  };

  const handleBioSave = () => {
    prefsMutation.mutate({ bio: bioValue }, {
      onSuccess: () => setEditingBio(false),
    });
  };

  const handlePrivacyToggle = (field, value) => {
    prefsMutation.mutate({ [field]: value ? 'public' : 'private' });
  };

  const handleInterestsEdit = () => {
    setInterestDraft(
      (prefs.interest_ids ?? []).map((id) => categoryMap[id]).filter(Boolean)
    );
    setEditingInterests(true);
  };

  const handleInterestsSave = () => {
    prefsMutation.mutate(
      { interest_ids: interestDraft.map((c) => c.id) },
      { onSuccess: () => setEditingInterests(false) }
    );
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    settingsMutation.mutate(formData);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      {strangerView && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<VisibilityOffIcon />}
              onClick={() => setStrangerView(false)}
            >
              Back to my profile
            </Button>
          }
        >
          Showing what other users see
        </Alert>
      )}

      {/* Avatar + Username */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
        <Box sx={{ position: 'relative', cursor: strangerView ? 'default' : 'pointer' }}>
          <Avatar
            src={user.avatar}
            alt={user.username}
            sx={{ width: 80, height: 80, fontSize: '2rem' }}
            onClick={() => !strangerView && avatarInputRef.current?.click()}
          >
            {user.username?.[0]?.toUpperCase()}
          </Avatar>
          {settingsMutation.isPending && (
            <CircularProgress
              size={80}
              sx={{ position: 'absolute', top: 0, left: 0, color: 'primary.main' }}
            />
          )}
        </Box>
        <Box>
          <Typography variant="h4">{user.username}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          {!strangerView && (
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => setStrangerView(true)}
              sx={{ mt: 0.5, px: 0 }}
            >
              View as Stranger
            </Button>
          )}
        </Box>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Bio */}
      <Box sx={{ mb: 3 }}>
        <SectionHeader title="Bio" onEdit={handleBioEdit} editing={editingBio} />
        {editingBio ? (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              inputProps={{ maxLength: 500 }}
              sx={{ mb: 1 }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleBioSave}
                disabled={prefsMutation.isPending}
              >
                Save
              </Button>
              <Button
                size="small"
                startIcon={<CloseIcon />}
                onClick={() => setEditingBio(false)}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        ) : (
          <Typography variant="body1" color={prefs.bio ? 'text.primary' : 'text.secondary'}>
            {prefs.bio || 'No bio yet.'}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Interests */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Interests</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {!strangerView && (
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={prefs.interests_privacy === 'public'}
                    onChange={(e) => handlePrivacyToggle('interests_privacy', e.target.checked)}
                  />
                }
                label={<Typography variant="caption">{prefs.interests_privacy === 'public' ? 'Public' : 'Private'}</Typography>}
              />
            )}
            {!editingInterests && !strangerView && (
              <IconButton size="small" onClick={handleInterestsEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Box>

        {editingInterests ? (
          <Box>
            <Autocomplete
              multiple
              options={categories}
              getOptionLabel={(opt) => opt.name}
              value={interestDraft}
              onChange={(_, val) => setInterestDraft(val)}
              renderTags={(val, getTagProps) =>
                val.map((opt, i) => (
                  <Chip label={opt.name} size="small" {...getTagProps({ index: i })} key={opt.id} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Select interests" size="small" />
              )}
              sx={{ mb: 1 }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleInterestsSave}
                disabled={prefsMutation.isPending}
              >
                Save
              </Button>
              <Button size="small" startIcon={<CloseIcon />} onClick={() => setEditingInterests(false)}>
                Cancel
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box>
            {visibleInterests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {strangerView && prefs.interests_privacy === 'private'
                  ? 'Interests are private.'
                  : 'No interests added yet.'}
              </Typography>
            ) : (
              <Stack direction="row" flexWrap="wrap" spacing={0.5} useFlexGap>
                {visibleInterests.map((id) => (
                  <Chip
                    key={id}
                    label={categoryMap[id]?.name ?? `Category #${id}`}
                    size="small"
                  />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Category Preferences */}
      {!strangerView || prefs.preferences_privacy === 'public' ? (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Gift Preferences</Typography>
            {!strangerView && (
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={prefs.preferences_privacy === 'public'}
                    onChange={(e) => handlePrivacyToggle('preferences_privacy', e.target.checked)}
                  />
                }
                label={<Typography variant="caption">{prefs.preferences_privacy === 'public' ? 'Public' : 'Private'}</Typography>}
              />
            )}
          </Box>
          {visiblePrefs.preferred.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Preferred categories
              </Typography>
              <Stack direction="row" flexWrap="wrap" spacing={0.5} useFlexGap>
                {visiblePrefs.preferred.map((id) => (
                  <Chip key={id} label={categoryMap[id]?.name ?? `#${id}`} size="small" color="primary" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
          {visiblePrefs.excluded.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Excluded categories
              </Typography>
              <Stack direction="row" flexWrap="wrap" spacing={0.5} useFlexGap>
                {visiblePrefs.excluded.map((id) => (
                  <Chip key={id} label={categoryMap[id]?.name ?? `#${id}`} size="small" color="error" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
          {visiblePrefs.preferred.length === 0 && visiblePrefs.excluded.length === 0 && (
            <Typography variant="body2" color="text.secondary">No preferences set.</Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Gift Preferences</Typography>
          <Typography variant="body2" color="text.secondary">Preferences are private.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default MyProfilePage;
