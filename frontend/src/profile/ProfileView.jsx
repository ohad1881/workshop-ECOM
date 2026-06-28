import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Spinner from '../general_components/Spinner';
import EmptyState from '../general_components/EmptyState';
import CustomSnackbar from '../general_components/CustomSnackbar';
import { getCategories } from '../api/taxonomy';
import CreateGiftButton from './CreateGiftButton';
import WishlistItemRow from './WishlistItemRow';
import AddWishlistItemDialog from './AddWishlistItemDialog';
import AddCategoryDialog from './AddCategoryDialog';
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
  // Names of categories added this session (may be outside the fetched page).
  const [nameHints, setNameHints] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success', action: null });

  const notify = (message, severity = 'success', action = null) =>
    setSnack({ open: true, message, severity, action });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  // Category name map for rendering preference chips.
  const needCategories =
    isOwner ||
    (profile.interestIds?.length || 0) > 0 ||
    (profile.preferredCategoryIds?.length || 0) > 0;
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ limit: 100 }),
    enabled: needCategories,
    staleTime: Infinity,
  });
  const nameMap = useMemo(() => {
    const map = new Map((catData?.results ?? catData ?? []).map((c) => [c.id, c.name]));
    Object.entries(nameHints).forEach(([id, name]) => map.set(Number(id), name));
    return map;
  }, [catData, nameHints]);

  const PREF_SECTIONS = [
    {
      field: 'preferred_category_ids',
      title: 'Preferred categories',
      ids: profile.preferredCategoryIds,
      privacy: profile.preferencesPrivacy,
    },
    {
      field: 'interest_ids',
      title: 'Tags',
      ids: profile.interestIds,
      privacy: profile.interestsPrivacy,
    },
  ];
  const currentIds = (field) =>
    (field === 'interest_ids' ? profile.interestIds : profile.preferredCategoryIds) || [];

  const addCategory = (category) => {
    const field = addCategoryField;
    setAddCategoryField(null);
    if (!field) return;
    setNameHints((h) => ({ ...h, [category.id]: category.name }));
    profileEdit.preferences.mutate(
      { [field]: [...currentIds(field), category.id] },
      { onSuccess: () => notify(`Added ${category.name}`), onError: () => notify('Could not update', 'error') },
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
        onSuccess: () => {
          setAddOpen(false);
          notify(`Added ${product.name}`);
        },
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
                ids={section.ids}
                nameMap={nameMap}
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
        />
      )}

      {isOwner && addCategoryField && (
        <AddCategoryDialog
          open
          onClose={() => setAddCategoryField(null)}
          onSelect={addCategory}
          excludeIds={currentIds(addCategoryField)}
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
