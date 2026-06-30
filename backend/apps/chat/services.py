import json

from google import genai
from google.genai import types
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder

from apps.recommendations.repositories import GiftGiverPreferenceRepository
from apps.users.repositories import UserRepository
from . import prompts
from .repositories import ChatRepository
from .tools import TOOLS, execute_tool
from common.logging import get_logger


logger = get_logger(__name__)

GEMINI_MODEL = 'gemini-3.1-flash-lite'
MAX_TOOL_ROUNDS = 5
MAX_TOKENS = 2048


class ChatService:
    @staticmethod
    def is_ai_configured():
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        return bool(api_key and not api_key.startswith('your-'))

    @staticmethod
    def get_sessions(user_id):
        return ChatRepository.get_sessions_for_user(user_id)

    @staticmethod
    def create_session(owner, recipient_id=None, budget=None,
                       event_type='', is_self_gift=False, title='',
                       stranger_description='', bundle_product_ids=()):
        if is_self_gift and recipient_id is None:
            recipient_id = owner.id
        if recipient_id and not UserRepository.get_by_id(recipient_id):
            raise ValueError("Recipient not found.")
        session = ChatRepository.create_session(
            owner_id=owner.id,
            recipient_id=recipient_id,
            budget=budget,
            event_type=event_type,
            is_self_gift=is_self_gift,
            title=title,
            stranger_description=stranger_description,
        )
        if bundle_product_ids:
            ChatService._seed_bundle_handoff(
                session, owner, recipient_id, budget, event_type, bundle_product_ids,
            )
        return session

    @staticmethod
    def _seed_bundle_handoff(session, owner, recipient_id, budget, event_type, product_ids):
        """Persist the gift-builder bundle as a single opening ASSISTANT message: a canned
        greeting carrying the bundle card. No model call — the assistant just acknowledges
        and waits. The model gets the bundle each turn via the CURRENT_BUNDLE prompt line,
        and `_build_contents` drops this leading assistant turn before calling Gemini.
        Best-effort: never break session creation."""
        from apps.products.serializers import ProductRecommendationSerializer
        from apps.recommendations.services import RecommendationService
        try:
            bundle = RecommendationService.build_bundle_for_products(
                product_ids=list(product_ids), budget=budget,
                recipient_id=recipient_id, event_type=event_type, giver_user=owner,
            )
            if not bundle:
                return
            result = {
                'items': [
                    {
                        'product': ProductRecommendationSerializer(i['product']).data,
                        'score': round(i['score'], 3),
                        'explanation': i['explanation'],
                    }
                    for i in bundle['items']
                ],
                'total_price': str(bundle['total_price']),
                'total_score': bundle['total_score'],
                'budget_utilization': bundle['budget_utilization'],
            }
            ChatRepository.create_message(
                session_id=session.id,
                role='assistant',
                content="I've loaded the gift bundle you put together. What can I help you with?",
                metadata={'tool_calls': [{'name': 'optimize_gift_bundle', 'input': {}, 'result': result}]},
            )
        except Exception:
            return

    @staticmethod
    def get_session(session_id, user):
        session = ChatRepository.get_session(session_id)
        if not session:
            raise ValueError("Session not found.")
        if session.owner_id != user.id:
            raise PermissionError("Not your session.")
        return session

    @staticmethod
    def delete_session(session_id, user):
        ChatService.get_session(session_id, user)  # raises if missing / not owner
        ChatRepository.delete_session(session_id)

    @staticmethod
    def update_giver_preference(user, preference_type, value, context=''):
        return GiftGiverPreferenceRepository.upsert(
            user=user,
            preference_type=preference_type,
            value=value,
            context=context,
        )

    @staticmethod
    def stream_message(session_id, user, content, mentioned_user_ids=(),
                       mentioned_product_ids=()):
        try:
            session = ChatService.get_session(session_id, user)
            ChatRepository.create_message(
                session_id=session.id,
                role='user',
                content=content,
                metadata={
                    'mentioned_user_ids': mentioned_user_ids,
                    'mentioned_product_ids': mentioned_product_ids,
                },
            )
            assistant_text, metadata = ChatService._generate_assistant_reply(
                session=session,
                user=user,
                mentioned_user_ids=mentioned_user_ids,
                mentioned_product_ids=mentioned_product_ids,
            )
        except Exception:
            logger.exception("Chat reply generation failed for session %s", session_id)
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
    def _generate_assistant_reply(session, user, mentioned_user_ids,
                                  mentioned_product_ids=()):
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        contents = ChatService._build_contents(
            ChatRepository.get_messages_for_api(session.id)
        )
        config = types.GenerateContentConfig(
            system_instruction=ChatService._build_system_prompt(
                session, user, mentioned_user_ids, mentioned_product_ids
            ),
            tools=[types.Tool(function_declarations=TOOLS)],
            max_output_tokens=MAX_TOKENS,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )
        metadata = {
            'mentioned_user_ids': mentioned_user_ids,
            'mentioned_product_ids': mentioned_product_ids,
            'tool_calls': [],
        }

        for _ in range(MAX_TOOL_ROUNDS + 1):
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=config,
            )

            candidate = response.candidates[0]
            parts = candidate.content.parts or []
            function_calls = [
                part.function_call for part in parts
                if getattr(part, 'function_call', None)
            ]
            if not function_calls:
                return ChatService._extract_text(parts), metadata

            contents.append(candidate.content)

            tool_result_parts = []
            for call in function_calls:
                call_args = dict(call.args or {})
                result = execute_tool(
                    call.name,
                    call_args,
                    giver_user=user,
                    recipient_id=session.recipient_id,
                    session_id=session.id,
                )
                metadata['tool_calls'].append({
                    'name': call.name,
                    'input': ChatService._json_safe(call_args),
                    'result': ChatService._json_safe(result),
                })
                tool_result_parts.append(types.Part.from_function_response(
                    name=call.name,
                    response={'result': ChatService._json_safe(result)},
                ))

            contents.append(types.Content(role='user', parts=tool_result_parts))

        return (
            "I gathered some context, but I need you to narrow the request a bit "
            "before I can give a useful recommendation.",
            metadata,
        )

    @staticmethod
    def _build_system_prompt(session, user, mentioned_user_ids,
                             mentioned_product_ids=()):
        is_stranger_mode = bool(session.stranger_description and not session.recipient_id)

        parts = [prompts.PREAMBLE.format(user_id=user.id)]

        if session.budget is not None:
            parts.append(prompts.BUDGET_RULE.format(budget=session.budget))
        if session.event_type:
            parts.append(prompts.OCCASION_RULE.format(event_type=session.event_type))

        if is_stranger_mode:
            parts.append(prompts.STRANGER_MODE.format(
                stranger_description=session.stranger_description,
            ))
        elif session.is_self_gift:
            parts.append(prompts.SELF_GIFT_MODE.format(
                bundle_refinement=prompts.BUNDLE_REFINEMENT_RULE,
            ))
        elif session.recipient_id:
            parts.append(prompts.RECIPIENT_MODE.format(
                recipient_id=session.recipient_id,
                bundle_refinement=prompts.BUNDLE_REFINEMENT_RULE,
            ))
        else:
            parts.append(prompts.NO_MODE_GUIDANCE.format(
                bundle_refinement=prompts.BUNDLE_REFINEMENT_RULE,
            ))

        bundle_ids = ChatRepository.get_latest_bundle_product_ids(session.id)
        if bundle_ids:
            bundle_line = ChatService._products_line(prompts.CURRENT_BUNDLE, bundle_ids)
            if bundle_line:
                parts.append(bundle_line)

        if mentioned_user_ids:
            parts.append(prompts.MENTIONED_USERS.format(
                ids=", ".join(str(uid) for uid in mentioned_user_ids),
            ))

        if mentioned_product_ids:
            products_line = ChatService._products_line(prompts.MENTIONED_PRODUCTS, mentioned_product_ids)
            if products_line:
                parts.append(products_line)

        return "\n".join(parts)

    @staticmethod
    def _products_line(template, product_ids):
        """Fill a prompt template with `name (id, $price)` labels so the model needn't look
        them up. Shared by the #-mention line and the current-bundle line."""
        from apps.products.repositories import ProductRepository
        # One batched query — unknown/inactive ids are simply absent from the result.
        products = ProductRepository.get_active_by_ids(product_ids)
        labels = [f"{p.name} (id {p.id}, ${p.price})" for p in products]
        if not labels:
            return ""
        return template.format(labels="; ".join(labels))

    @staticmethod
    def _build_contents(messages):
        """Map stored {role, content} messages to Gemini Content objects. Gemini requires
        the first turn to be 'user', so drop any leading assistant turns — e.g. the seeded
        gift-builder greeting that opens a handoff session."""
        contents = []
        for m in messages:
            role = 'model' if m['role'] == 'assistant' else 'user'
            if not contents and role == 'model':
                continue  # skip leading assistant turn(s)
            contents.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=m['content'])],
            ))
        return contents

    @staticmethod
    def _extract_text(parts):
        text = ''.join(
            getattr(part, 'text', '') or '' for part in parts
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
