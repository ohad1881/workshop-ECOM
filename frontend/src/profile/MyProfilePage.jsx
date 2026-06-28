import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../api/auth';
import { getMyWishlist } from '../api/wishlists';
import { resolveMediaUrl } from '../utils/media';
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
    avatarUrl: resolveMediaUrl(me.avatar),
    bio: prefs.bio || '',
    dateJoined: me.date_joined,
    interestIds: prefs.interest_ids || [],
    preferredCategoryIds: prefs.preferred_category_ids || [],
    interestsPrivacy: prefs.interests_privacy,
    preferencesPrivacy: prefs.preferences_privacy,
  };

  return (
    <ProfileView profile={profile} wishlist={wishlist} isOwner wishlistLoading={wishlistLoading} />
  );
};

export default MyProfilePage;
