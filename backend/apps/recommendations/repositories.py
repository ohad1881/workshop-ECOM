from apps.chat.models import GiftGiverPreference
from .models import GiftHistory


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


class GiftHistoryRepository:
    @staticmethod
    def create(giver, recipient, recipient_stranger_name, budget, event_type, strategy, items, total_price):
        return GiftHistory.objects.create(
            giver=giver,
            recipient=recipient,
            recipient_stranger_name=recipient_stranger_name or '',
            budget=budget,
            event_type=event_type or '',
            strategy=strategy or '',
            items=items,
            total_price=total_price,
        )

    @staticmethod
    def get_for_giver(user_id):
        return GiftHistory.objects.filter(giver_id=user_id).order_by('-created_at')

    @staticmethod
    def get_by_id(history_id):
        return GiftHistory.objects.filter(id=history_id).first()

    @staticmethod
    def delete(history_id):
        GiftHistory.objects.filter(id=history_id).delete()
