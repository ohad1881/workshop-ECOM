from apps.recommendations.repositories import GiftGiverPreferenceRepository
from .repositories import ChatRepository


class ChatService:
    @staticmethod
    def get_sessions(user_id):
        return ChatRepository.get_sessions_for_user(user_id)

    @staticmethod
    def create_session(owner, recipient_id=None, budget=None,
                       event_type='', is_self_gift=False, title=''):
        return ChatRepository.create_session(
            owner_id=owner.id,
            recipient_id=recipient_id,
            budget=budget,
            event_type=event_type,
            is_self_gift=is_self_gift,
            title=title,
        )

    @staticmethod
    def get_session(session_id, user):
        session = ChatRepository.get_session(session_id)
        if not session:
            raise ValueError("Session not found.")
        if session.owner_id != user.id:
            raise PermissionError("Not your session.")
        return session

    @staticmethod
    def update_giver_preference(user, preference_type, value, context=''):
        return GiftGiverPreferenceRepository.upsert(
            user=user,
            preference_type=preference_type,
            value=value,
            context=context,
        )
