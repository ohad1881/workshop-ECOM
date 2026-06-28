import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getUserPublicWishlist } from '../api/users';
import { useAuth } from '../context/auth/useAuth';
import { resolveMediaUrl } from '../utils/media';
import Spinner from '../general_components/Spinner';
import EmptyState from '../general_components/EmptyState';
import ProfileView from './ProfileView';

// Another user's public, read-only profile (route /users/:id). Viewing your own id
// redirects to /profile so there's only ever one editable view of yourself.
const UserProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isSelf = user && Number(id) === user.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserProfile(id),
    enabled: !isSelf,
  });
  const { data: wishlist = [], isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist', id],
    queryFn: () => getUserPublicWishlist(id),
    enabled: !isSelf,
  });

  if (isSelf) return <Navigate to="/profile" replace />;
  if (isLoading) return <Spinner fullHeight />;
  if (isError || !data) {
    return <EmptyState title="User not found" description="This profile doesn't exist or is unavailable." />;
  }

  const profile = {
    id: data.id,
    username: data.username,
    avatarUrl: resolveMediaUrl(data.avatar),
    bio: data.bio || '',
    dateJoined: data.date_joined,
    // Absent when the user keeps these private — ProfileSidebar hides empty sections.
    interestIds: data.interest_ids || null,
    preferredCategoryIds: data.preferred_category_ids || null,
  };

  return (
    <ProfileView
      profile={profile}
      wishlist={wishlist}
      isOwner={false}
      wishlistLoading={wishlistLoading}
    />
  );
};

export default UserProfilePage;
