from django.utils import timezone

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
        return (
            ChatSession.objects
            .select_related('recipient')
            .filter(owner_id=user_id)
            .order_by('-updated_at')
        )

    @staticmethod
    def create_session(owner_id, recipient_id=None, budget=None,
                       event_type='', is_self_gift=False, title='',
                       stranger_description=''):
        return ChatSession.objects.create(
            owner_id=owner_id,
            recipient_id=recipient_id,
            budget=budget,
            event_type=event_type,
            is_self_gift=is_self_gift,
            title=title,
            stranger_description=stranger_description,
        )

    @staticmethod
    def delete_session(session_id):
        ChatSession.objects.filter(id=session_id).delete()

    @staticmethod
    def get_messages_for_api(session_id):
        """Return messages as {role, content} dicts for the chat model API."""
        msgs = (
            ChatMessage.objects
            .filter(session_id=session_id, role__in=['user', 'assistant'])
            .order_by('created_at')
        )
        return [{'role': m.role, 'content': m.content} for m in msgs]

    @staticmethod
    def get_latest_bundle_product_ids(session_id):
        """Product ids from the most recent optimize_gift_bundle tool result in the session
        — i.e. the 'current bundle' the assistant should keep refining. [] if none."""
        msgs = (
            ChatMessage.objects
            .filter(session_id=session_id, role='assistant')
            .order_by('-created_at')
        )
        for m in msgs:
            for call in (m.metadata or {}).get('tool_calls', []):
                if call.get('name') not in ('optimize_gift_bundle', 'edit_gift_bundle'):
                    continue
                result = call.get('result')
                items = result.get('items') if isinstance(result, dict) else None
                if items:
                    return [it['product']['id'] for it in items if it.get('product')]
        return []

    @staticmethod
    def create_message(session_id, role, content, metadata=None):
        message = ChatMessage.objects.create(
            session_id=session_id,
            role=role,
            content=content,
            metadata=metadata or {},
        )
        ChatRepository.touch_session(session_id)
        return message

    @staticmethod
    def touch_session(session_id):
        ChatSession.objects.filter(id=session_id).update(updated_at=timezone.now())

    @staticmethod
    def trim_oldest_messages(session_id, keep=50):
        msgs = ChatMessage.objects.filter(session_id=session_id).order_by('created_at')
        total = msgs.count()
        if total > keep:
            ids_to_delete = list(msgs[: total - keep].values_list('id', flat=True))
            ChatMessage.objects.filter(id__in=ids_to_delete).delete()
