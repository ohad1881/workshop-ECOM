import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Button, Chip, Stack, Divider, Alert,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getUserPublicWishlist } from '../api/users';
import { getCategories } from '../api/taxonomy';
import { useAuth } from '../context/auth/useAuth';
import { formatCurrency } from '../utils/formatters';
import Spinner from '../general_components/Spinner';

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserProfile(id),
    enabled: !me || String(me.id) !== String(id),
  });

  const wishlistQuery = useQuery({
    queryKey: ['user', id, 'wishlist'],
    queryFn: () => getUserPublicWishlist(id),
    enabled: !!profileQuery.data,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ limit: 100 }),
  });

  if (me && String(me.id) === String(id)) {
    return <Navigate to="/profile" replace />;
  }

  const categoryMap = Object.fromEntries(
    (categoriesData?.results ?? []).map((c) => [c.id, c])
  );

  if (profileQuery.isLoading) return <Spinner fullHeight />;
  if (profileQuery.error) {
    return (
      <Alert severity="error">
        {profileQuery.error.response?.status === 404
          ? 'User not found.'
          : 'Failed to load profile.'}
      </Alert>
    );
  }

  const profile = profileQuery.data;
  const wishlist = Array.isArray(wishlistQuery.data) ? wishlistQuery.data : [];

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
        <Avatar
          src={profile.avatar}
          alt={profile.username}
          sx={{ width: 80, height: 80, fontSize: '2rem' }}
        >
          {profile.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">{profile.username}</Typography>
          {profile.bio && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {profile.bio}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<CardGiftcardIcon />}
          onClick={() => navigate(`/gift-finder?recipientId=${profile.id}`)}
        >
          Find a gift for {profile.username}
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Interests */}
      {profile.interests_privacy === 'public' && profile.interest_ids?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Interests</Typography>
          <Stack direction="row" flexWrap="wrap" spacing={0.5} useFlexGap>
            {profile.interest_ids.map((catId) => (
              <Chip key={catId} label={categoryMap[catId]?.name ?? `Category #${catId}`} size="small" />
            ))}
          </Stack>
        </Box>
      )}

      {/* Preferences */}
      {profile.preferences_privacy === 'public' && (
        <Box sx={{ mb: 3 }}>
          {profile.preferred_category_ids?.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Preferred Categories</Typography>
              <Stack direction="row" flexWrap="wrap" spacing={0.5} useFlexGap>
                {profile.preferred_category_ids.map((catId) => (
                  <Chip key={catId} label={categoryMap[catId]?.name ?? `#${catId}`} size="small" color="primary" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
          {profile.excluded_category_ids?.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>Excluded Categories</Typography>
              <Stack direction="row" flexWrap="wrap" spacing={0.5} useFlexGap>
                {profile.excluded_category_ids.map((catId) => (
                  <Chip key={catId} label={categoryMap[catId]?.name ?? `#${catId}`} size="small" color="error" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      )}

      {/* Public Wishlist Preview */}
      {(wishlist.length > 0 || wishlistQuery.isLoading) && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Wishlist</Typography>
            {wishlistQuery.isLoading ? (
              <Spinner />
            ) : (
              <Stack spacing={1}>
                {wishlist.slice(0, 6).map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight={600}>
                      {formatCurrency(item.product.price)}
                    </Typography>
                  </Box>
                ))}
                {wishlist.length > 6 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    +{wishlist.length - 6} more items
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default UserProfilePage;
