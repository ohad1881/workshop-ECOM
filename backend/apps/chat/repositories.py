from .models import ChatMessage, ChatSession


class ChatRepository:
    @staticmethod
    def get_session(session_id):
        return (
            ChatSession.objects
            .select_related('owner', 'recipient')
            .filter(id=session_id)
            .first()
        )

    @staticmethod
    def get_sessions_for_user(user_id):
        return ChatSession.objects.filter(owner_id=user_id).order_by('-updated_at')

    @staticmethod
    def create_session(owner_id, recipient_id=None, budget=None,
                       event_type='', is_self_gift=False, title=''):
        return ChatSession.objects.create(
            owner_id=owner_id,
            recipient_id=recipient_id,
            budget=budget,
            event_type=event_type,
            is_self_gift=is_self_gift,
            title=title,
        )

    @staticmethod
    def get_messages_for_api(session_id):
        """Return messages formatted for the Claude messages API."""
        msgs = (
            ChatMessage.objects
            .filter(session_id=session_id, role__in=['user', 'assistant'])
            .order_by('created_at')
        )
        return [{'role': m.role, 'content': m.content} for m in msgs]

    @staticmethod
    def get_all_messages(session_id):
        return ChatMessage.objects.filter(session_id=session_id).order_by('created_at')

    @staticmethod
    def create_message(session_id, role, content, metadata=None):
        return ChatMessage.objects.create(
            session_id=session_id,
            role=role,
            content=content,
            metadata=metadata or {},
        )

    @staticmethod
    def count_messages(session_id):
        return ChatMessage.objects.filter(session_id=session_id).count()

    @staticmethod
    def trim_oldest_messages(session_id, keep=50):
        msgs = ChatMessage.objects.filter(session_id=session_id).order_by('created_at')
        total = msgs.count()
        if total > keep:
            ids_to_delete = list(msgs[: total - keep].values_list('id', flat=True))
            ChatMessage.objects.filter(id__in=ids_to_delete).delete()
