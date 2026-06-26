from apps.chat.models import GiftGiverPreference


class GiftGiverPreferenceRepository:
    @staticmethod
    def get_for_user(user_id):
        return list(GiftGiverPreference.objects.filter(user_id=user_id))

    @staticmethod
    def upsert(user, preference_type, value, context=''):
        pref, _ = GiftGiverPreference.objects.update_or_create(
            user=user,
            preference_type=preference_type,
            value=value,
            defaults={'context': context},
        )
        return pref
