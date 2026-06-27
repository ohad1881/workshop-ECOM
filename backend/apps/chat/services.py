import json

from anthropic import Anthropic
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder

from apps.recommendations.repositories import GiftGiverPreferenceRepository
from apps.users.repositories import UserRepository
from .repositories import ChatRepository
from .tools import TOOLS, execute_tool


ANTHROPIC_MODEL = 'claude-sonnet-4-6'
MAX_TOOL_ROUNDS = 5
MAX_TOKENS = 2048


class ChatService:
    @staticmethod
    def is_ai_configured():
        api_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
        return bool(api_key and not api_key.startswith('your-'))

    @staticmethod
    def get_sessions(user_id):
        return ChatRepository.get_sessions_for_user(user_id)

    @staticmethod
    def create_session(owner, recipient_id=None, budget=None,
                       event_type='', is_self_gift=False, title='',
                       stranger_description=''):
        if is_self_gift and recipient_id is None:
            recipient_id = owner.id
        if recipient_id and not UserRepository.get_by_id(recipient_id):
            raise ValueError("Recipient not found.")
        return ChatRepository.create_session(
            owner_id=owner.id,
            recipient_id=recipient_id,
            budget=budget,
            event_type=event_type,
            is_self_gift=is_self_gift,
            title=title,
            stranger_description=stranger_description,
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

    @staticmethod
    def stream_message(session_id, user, content, mentioned_user_ids=None):
        mentioned_user_ids = mentioned_user_ids or []
        try:
            session = ChatService.get_session(session_id, user)
            ChatRepository.create_message(
                session_id=session.id,
                role='user',
                content=content,
                metadata={'mentioned_user_ids': mentioned_user_ids},
            )
            assistant_text, metadata = ChatService._generate_assistant_reply(
                session=session,
                user=user,
                mentioned_user_ids=mentioned_user_ids,
            )
        except Exception:
            assistant_text = (
                "Sorry, I couldn't complete that chat request right now. "
                "Please try again in a moment."
            )
            metadata = {'error': 'assistant_generation_failed'}
            try:
                session = ChatService.get_session(session_id, user)
            except Exception:
                session = None

        if session:
            ChatRepository.create_message(
                session_id=session.id,
                role='assistant',
                content=assistant_text,
                metadata=metadata,
            )
            ChatRepository.trim_oldest_messages(
                session.id,
                keep=session.MAX_MESSAGES_PER_SESSION,
            )

        for chunk in ChatService._chunk_text(assistant_text):
            yield ChatService._sse({'text': chunk})
        yield 'data: [DONE]\n\n'

    @staticmethod
    def _generate_assistant_reply(session, user, mentioned_user_ids):
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        messages = ChatRepository.get_messages_for_api(session.id)
        metadata = {'mentioned_user_ids': mentioned_user_ids, 'tool_calls': []}

        for _ in range(MAX_TOOL_ROUNDS + 1):
            response = client.messages.create(
                model=ANTHROPIC_MODEL,
                max_tokens=MAX_TOKENS,
                system=ChatService._build_system_prompt(session, user, mentioned_user_ids),
                messages=messages,
                tools=TOOLS,
            )

            tool_uses = [
                block for block in response.content
                if getattr(block, 'type', None) == 'tool_use'
            ]
            if not tool_uses:
                return ChatService._extract_text(response.content), metadata

            messages.append({
                'role': 'assistant',
                'content': [
                    ChatService._content_block_to_param(block)
                    for block in response.content
                ],
            })

            tool_results = []
            for tool_use in tool_uses:
                result = execute_tool(
                    tool_use.name,
                    tool_use.input,
                    giver_user=user,
                    recipient_id=session.recipient_id,
                )
                metadata['tool_calls'].append({
                    'name': tool_use.name,
                    'input': ChatService._json_safe(tool_use.input),
                    'result': ChatService._json_safe(result),
                })
                tool_results.append({
                    'type': 'tool_result',
                    'tool_use_id': tool_use.id,
                    'content': json.dumps(result, cls=DjangoJSONEncoder),
                })

            messages.append({'role': 'user', 'content': tool_results})

        return (
            "I gathered some context, but I need you to narrow the request a bit "
            "before I can give a useful recommendation.",
            metadata,
        )

    @staticmethod
    def _build_system_prompt(session, user, mentioned_user_ids):
        is_stranger_mode = bool(session.stranger_description and not session.recipient_id)

        parts = [
            "You are GiftGraph's gifting assistant. Help users find thoughtful, personalised gifts.",
            "",
            "## Core rules",
            "1. Before making any recommendation, call `get_giver_preferences` to load the user's gifting history.",
            "2. When the user expresses a like or dislike (e.g. 'I never buy tech gifts', 'she loves candles'), "
            "immediately call `update_giver_preference` with the appropriate type and value.",
            "3. Always explain WHY each gift matches the recipient.",
            "4. Respect privacy: only use public recipient data from tools.",
            f"5. Current user id: {user.id}.",
        ]

        if session.budget is not None:
            parts.append(f"6. Session budget: ${session.budget}. Never recommend items above this budget.")
        if session.event_type:
            parts.append(f"7. Occasion: {session.event_type}.")

        if is_stranger_mode:
            parts += [
                "",
                "## Stranger Mode",
                "The recipient is NOT a registered GiftGraph user. Their description is:",
                f'  "{session.stranger_description}"',
                "",
                "Follow this flow:",
                "  a. Acknowledge the description, then ask 1–2 targeted clarifying questions "
                "(e.g. age range, specific hobbies, things they already own) before suggesting anything.",
                "  b. After the user answers, build a Temporary Profile in your reasoning: "
                "infer likely interests, preferred categories, and price sensitivity.",
                "  c. Use `search_products` filtered by those inferred categories/tags to find candidates.",
                "  d. Use `optimize_gift_bundle` if the user wants a multi-item bundle.",
                "  e. Do NOT call `get_recipient_profile` or `get_recommendations` — "
                "those require a registered recipient_id which does not exist here.",
            ]
        elif session.is_self_gift:
            parts += [
                "",
                "## Self-gift mode",
                "The user is shopping for themselves. You have access to their full private profile data.",
                "Use `get_recommendations` and `optimize_gift_bundle` with their own user id as recipient.",
            ]
        elif session.recipient_id:
            parts += [
                "",
                f"## Recipient",
                f"Registered recipient id: {session.recipient_id}.",
                "Call `get_recipient_profile` first to understand their interests, then "
                "`get_recommendations` to score products, then `optimize_gift_bundle` for bundles.",
            ]

        if mentioned_user_ids:
            parts.append(
                "\nUser IDs mentioned in the latest message: "
                + ", ".join(str(uid) for uid in mentioned_user_ids) + "."
            )

        return "\n".join(parts)

    @staticmethod
    def _content_block_to_param(block):
        block_type = getattr(block, 'type', None)
        if block_type == 'text':
            return {'type': 'text', 'text': block.text}
        if block_type == 'tool_use':
            return {
                'type': 'tool_use',
                'id': block.id,
                'name': block.name,
                'input': block.input,
            }
        return {'type': 'text', 'text': ''}

    @staticmethod
    def _extract_text(content_blocks):
        text = ''.join(
            block.text for block in content_blocks
            if getattr(block, 'type', None) == 'text'
        ).strip()
        return text or "I couldn't produce a recommendation from the available context."

    @staticmethod
    def _chunk_text(text, size=80):
        for start in range(0, len(text), size):
            yield text[start:start + size]

    @staticmethod
    def _sse(payload):
        return f"data: {json.dumps(payload, cls=DjangoJSONEncoder)}\n\n"

    @staticmethod
    def _json_safe(value):
        return json.loads(json.dumps(value, cls=DjangoJSONEncoder))
