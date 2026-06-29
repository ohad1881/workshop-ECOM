import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../api/auth';
import { getMyWishlist } from '../api/wishlists';
import { gravatarUrl } from '../utils/gravatar';
import Spinner from '../general_components/Spinner';
import EmptyState from '../general_components/EmptyState';
import ProfileView from './ProfileView';

// The logged-in user's own (editable) profile. Thin loader: fetch + normalize → ProfileView.
const MyProfilePage = () => {
  const { data: me, isLoading, isError } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });
  const { data: wishlist = [], isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist', 'me'],
    queryFn: getMyWishlist,
  });

  if (isLoading) return <Spinner fullHeight />;
  if (isError || !me) {
    return <EmptyState title="Couldn't load your profile" description="Please try again." />;
  }

  const prefs = me.preferences || {};
  const profile = {
    id: me.id,
    username: me.username,
    avatarUrl: gravatarUrl(me.gravatar_hash, { size: 320 }),
    bio: prefs.bio || '',
    dateJoined: me.date_joined,
    interestIds: prefs.interest_ids || [],
    preferredCategoryIds: prefs.preferred_category_ids || [],
    excludedCategoryIds: prefs.excluded_category_ids || [],
  };

  return (
    <ProfileView profile={profile} wishlist={wishlist} isOwner wishlistLoading={wishlistLoading} />
  );
};

export default MyProfilePage;
