import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Spinner from '../general_components/Spinner';
import EmptyState from '../general_components/EmptyState';
import CustomSnackbar from '../general_components/CustomSnackbar';
import { getCategories, getTags } from '../api/taxonomy';
import CreateGiftButton from './CreateGiftButton';
import WishlistItemRow from './WishlistItemRow';
import AddWishlistItemDialog from './AddWishlistItemDialog';
import AddPreferenceDialog from './AddPreferenceDialog';
import PreferenceSection from './PreferenceSection';
import ProfileSidebar from './ProfileSidebar';
import { useWishlistEditing } from './useWishlistEditing';
import { useProfileEdit } from './useProfileEdit';

// The shared profile template. Both /profile (isOwner) and /users/:id (read-only)
// render this with the same normalized props — only `isOwner` changes behavior.
const ProfileView = ({ profile, wishlist, isOwner, wishlistLoading }) => {
  const editing = useWishlistEditing();
  const profileEdit = useProfileEdit();
  const [addOpen, setAddOpen] = useState(false);
  // Which preference list the category picker is adding to (null = closed).
  const [addCategoryField, setAddCategoryField] = useState(null);
  // Items added this session, bucketed by taxonomy (may be outside the fetched
  // page); merged into the name maps so freshly-added chips render their name/icon.
  const [hints, setHints] = useState({ categories: {}, tags: {} });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success', action: null });

  const notify = (message, severity = 'success', action = null) =>
    setSnack({ open: true, message, severity, action });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  // Each preference field draws from one taxonomy: categories or tags.
  const sourceFor = (field) => (field === 'interest_ids' ? 'tags' : 'categories');

  // Name/icon maps for rendering preference chips — one per taxonomy.
  const needCategories =
    isOwner ||
    (profile.preferredCategoryIds?.length || 0) > 0 ||
    (profile.excludedCategoryIds?.length || 0) > 0;
  const needTags = isOwner || (profile.interestIds?.length || 0) > 0;
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ limit: 100 }),
    enabled: needCategories,
    staleTime: Infinity,
  });
  const { data: tagData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags({ limit: 100 }),
    enabled: needTags,
    staleTime: Infinity,
  });
  const buildMap = (data, hintBucket) => {
    const map = new Map(
      (data?.results ?? data ?? []).map((item) => [item.id, { name: item.name, icon: item.icon }]),
    );
    Object.entries(hintBucket).forEach(([id, item]) => map.set(Number(id), item));
    return map;
  };
  const catMap = useMemo(() => buildMap(catData, hints.categories), [catData, hints.categories]);
  const tagMap = useMemo(() => buildMap(tagData, hints.tags), [tagData, hints.tags]);
  const mapFor = (field) => (sourceFor(field) === 'tags' ? tagMap : catMap);

  const PREF_SECTIONS = [
    {
      field: 'preferred_category_ids',
      title: 'Preferred categories',
      icon: <ThumbUpIcon fontSize="small" color="success" />,
      ids: profile.preferredCategoryIds,
      privacy: profile.preferencesPrivacy,
    },
    {
      field: 'excluded_category_ids',
      title: 'Disliked categories',
      icon: <ThumbDownIcon fontSize="small" color="error" />,
      ids: profile.excludedCategoryIds,
      privacy: profile.preferencesPrivacy,
    },
    {
      field: 'interest_ids',
      title: 'Tags',
      icon: <LocalOfferIcon fontSize="small" color="primary" />,
      ids: profile.interestIds,
      privacy: profile.interestsPrivacy,
    },
  ];
  const currentIds = (field) => {
    if (field === 'interest_ids') return profile.interestIds || [];
    if (field === 'excluded_category_ids') return profile.excludedCategoryIds || [];
    return profile.preferredCategoryIds || [];
  };

  // Categories to hide from the picker: the field's own items, plus the opposing
  // list for preferred/disliked so a category can't sit in both.
  const pickerExcludeIds = (field) => {
    if (field === 'preferred_category_ids')
      return [...(profile.preferredCategoryIds || []), ...(profile.excludedCategoryIds || [])];
    if (field === 'excluded_category_ids')
      return [...(profile.excludedCategoryIds || []), ...(profile.preferredCategoryIds || [])];
    return currentIds(field);
  };

  const addItem = (item) => {
    const field = addCategoryField;
    if (!field) return;
    const source = sourceFor(field);
    // Keep the picker open so several can be added in a row; the just-added one
    // drops out of the list via the dialog's excludeIds.
    setHints((h) => ({
      ...h,
      [source]: { ...h[source], [item.id]: { name: item.name, icon: item.icon } },
    }));
    profileEdit.preferences.mutate(
      { [field]: [...currentIds(field), item.id] },
      { onSuccess: () => notify(`Added ${item.name}`), onError: () => notify('Could not update', 'error') },
    );
  };

  const removeCategory = (field, id) =>
    profileEdit.preferences.mutate(
      { [field]: currentIds(field).filter((x) => x !== id) },
      { onError: () => notify('Could not update', 'error') },
    );

  const handleWant = (item, value) =>
    editing.patch.mutate(
      { id: item.id, data: { priority: value ?? 0 } },
      { onError: () => notify('Could not update', 'error') },
    );

  const handlePrivacy = (item, privacy) =>
    editing.patch.mutate(
      { id: item.id, data: { privacy } },
      { onError: () => notify('Could not update privacy', 'error') },
    );

  const undoDelete = (item) =>
    editing.add.mutate(
      {
        product_id: item.product.id,
        privacy: item.privacy,
        priority: item.priority,
        note: item.note || '',
      },
      { onSuccess: () => notify('Item restored'), onError: () => notify('Could not restore', 'error') },
    );

  const handleDelete = (item) =>
    editing.remove.mutate(item.id, {
      onSuccess: () =>
        notify(
          'Removed from wishlist',
          'success',
          <Button color="inherit" size="small" onClick={() => undoDelete(item)}>
            Undo
          </Button>,
        ),
      onError: () => notify('Could not remove', 'error'),
    });

  const handleAdd = (product) => {
    editing.add.mutate(
      { product_id: product.id, privacy: 'public', priority: 3 },
      {
        onSuccess: () => notify(`Added ${product.name}`),
        onError: (e) =>
          e?.response?.status === 409
            ? notify(`${product.name} is already on your wishlist`, 'info')
            : notify('Could not add item', 'error'),
      },
    );
  };

  const addTile = (
    <ButtonBase
      onClick={() => setAddOpen(true)}
      sx={{
        width: '100%',
        py: 3,
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        color: 'text.secondary',
        display: 'flex',
        gap: 1,
        '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
      }}
    >
      <AddIcon />
      <Typography>Add a product</Typography>
    </ButtonBase>
  );

  const renderWishlist = () => {
    if (wishlistLoading) return <Spinner />;
    const isEmpty = !wishlist || wishlist.length === 0;

    if (isEmpty && !isOwner) {
      return <EmptyState title="No public items yet" description="This user hasn't shared any wishlist items." />;
    }

    return (
      <Stack spacing={1.5}>
        {wishlist.map((item) => (
          <WishlistItemRow
            key={item.id}
            item={item}
            isOwner={isOwner}
            onWant={handleWant}
            onPrivacy={handlePrivacy}
            onDelete={handleDelete}
          />
        ))}
        {isOwner && addTile}
      </Stack>
    );
  };

  return (
    <Box sx={{ py: 4 }}>
      {/* Top-right CTA — kept out of the columns so it doesn't affect alignment. */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <CreateGiftButton
          isOwner={isOwner}
          recipientId={profile.id}
          recipientName={profile.username}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          alignItems: 'flex-start',
        }}
      >
        {/* Left: identity */}
        <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
          <ProfileSidebar
            profile={profile}
            isOwner={isOwner}
            profileEdit={profileEdit}
            onNotify={notify}
          />
        </Box>

        {/* Right: wishlist + preferences */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            {isOwner ? 'My wishlist' : `${profile.username}'s wishlist`}
          </Typography>

          {renderWishlist()}

          <Stack spacing={3} sx={{ mt: 4 }}>
            {PREF_SECTIONS.map((section) => (
              <PreferenceSection
                key={section.field}
                title={section.title}
                icon={section.icon}
                ids={section.ids}
                nameMap={mapFor(section.field)}
                privacy={section.privacy}
                isOwner={isOwner}
                onAdd={() => setAddCategoryField(section.field)}
                onRemove={(id) => removeCategory(section.field, id)}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {isOwner && addOpen && (
        <AddWishlistItemDialog
          open
          onClose={() => setAddOpen(false)}
          onSelect={handleAdd}
          adding={editing.add.isPending}
          existingProductIds={(wishlist ?? []).map((i) => i.product.id)}
        />
      )}

      {isOwner && addCategoryField && (
        <AddPreferenceDialog
          open
          source={sourceFor(addCategoryField)}
          onClose={() => setAddCategoryField(null)}
          onSelect={addItem}
          excludeIds={pickerExcludeIds(addCategoryField)}
          saving={profileEdit.preferences.isPending}
        />
      )}

      <CustomSnackbar
        open={snack.open}
        message={snack.message}
        severity={snack.severity}
        action={snack.action}
        onClose={closeSnack}
      />
    </Box>
  );
};

export default ProfileView;
