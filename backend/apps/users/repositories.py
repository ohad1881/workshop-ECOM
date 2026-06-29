from .models import User, UserProfile


class UserRepository:
    @staticmethod
    def get_by_id(user_id):
        return User.objects.select_related('profile').filter(id=user_id).first()

    @staticmethod
    def get_by_email(email):
        return User.objects.filter(email=email).first()

    @staticmethod
    def create_user(email, username, password):
        return User.objects.create_user(
            email=email,
            username=username,
            password=password,
        )

    @staticmethod
    def update_user(user, **kwargs):
        for key, value in kwargs.items():
            setattr(user, key, value)
        user.save(update_fields=list(kwargs.keys()))
        return user

    @staticmethod
    def search_by_username(query, limit=20):
        return User.objects.filter(username__icontains=query)[:limit]

    @staticmethod
    def get_profile(user_id):
        return UserProfile.objects.select_related('user').filter(user_id=user_id).first()

    @staticmethod
    def update_profile(profile, bio=None, interest_ids=None, preferred_category_ids=None,
                       excluded_category_ids=None):
        if bio is not None:
            profile.user.bio = bio
            profile.user.save(update_fields=['bio'])

        if interest_ids is not None:
            profile.interests.set(interest_ids)
        if preferred_category_ids is not None:
            profile.preferred_categories.set(preferred_category_ids)
        if excluded_category_ids is not None:
            profile.excluded_categories.set(excluded_category_ids)

        return profile
