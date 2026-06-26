from .repositories import UserRepository


class AuthService:
    @staticmethod
    def register(email, username, password):
        if UserRepository.get_by_email(email):
            raise ValueError("Email already registered")
        return UserRepository.create_user(email=email, username=username, password=password)

    @staticmethod
    def change_password(user, old_password, new_password):
        if not user.check_password(old_password):
            raise ValueError("Current password is incorrect")
        user.set_password(new_password)
        user.save()


class UserService:
    @staticmethod
    def get_public_profile(user_id):
        """Returns user data with privacy settings applied. Used by both REST API and AI tools."""
        user = UserRepository.get_by_id(user_id)
        if not user:
            return None

        profile = user.profile
        data = {
            'id': user.id,
            'username': user.username,
            'bio': user.bio,
            'avatar': user.avatar.url if user.avatar else None,
            'interests_privacy': profile.interests_privacy,
            'preferences_privacy': profile.preferences_privacy,
        }

        if profile.interests_privacy == 'public':
            data['interest_ids'] = list(profile.interests.values_list('id', flat=True))

        if profile.preferences_privacy == 'public':
            data['preferred_category_ids'] = list(
                profile.preferred_categories.values_list('id', flat=True)
            )
            data['excluded_category_ids'] = list(
                profile.excluded_categories.values_list('id', flat=True)
            )

        return data
