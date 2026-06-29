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
        """Returns a user's public profile. Used by both REST API and AI tools.

        Interests and category preferences are always public; only wishlist items
        carry privacy.
        """
        user = UserRepository.get_by_id(user_id)
        if not user:
            return None

        profile = user.profile
        return {
            'id': user.id,
            'username': user.username,
            'gravatar_hash': user.gravatar_hash,
            'bio': user.bio,
            'date_joined': user.date_joined,
            'interest_ids': list(profile.interests.values_list('id', flat=True)),
            'preferred_category_ids': list(
                profile.preferred_categories.values_list('id', flat=True)
            ),
            'excluded_category_ids': list(
                profile.excluded_categories.values_list('id', flat=True)
            ),
        }
