from decimal import Decimal

# Gemini function declarations (OpenAPI-subset schema, uppercase types).
TOOLS = [
    {
        "name": "search_products",
        "description": (
            "Search the product catalog. Returns matching products with name, price, "
            "category, and tags."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING", "description": "Free-text search query"},
                "category": {"type": "STRING", "description": "Category slug to filter by"},
                "min_price": {"type": "NUMBER"},
                "max_price": {"type": "NUMBER"},
                "tag_slugs": {"type": "ARRAY", "items": {"type": "STRING"}},
            },
        },
    },
    {
        "name": "get_recipient_profile",
        "description": (
            "Get a user's public interests, preferred categories, and public wishlist items."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "user_id": {"type": "INTEGER"},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_recommendations",
        "description": (
            "Get scored product recommendations for a recipient within a budget. "
            "Always ask for recipient_id and budget before calling this."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "recipient_id": {"type": "INTEGER"},
                "budget": {"type": "NUMBER"},
                "event_type": {"type": "STRING"},
                "limit": {"type": "INTEGER"},
            },
            "required": ["recipient_id", "budget"],
        },
    },
    {
        "name": "optimize_gift_bundle",
        "description": (
            "Run the knapsack optimizer to find the best combination of gifts within budget. "
            "Provide `recipient_id` for a registered recipient; OR `candidate_product_ids` "
            "(e.g. ids returned by `search_products`) when there is no registered recipient "
            "(stranger mode). Use `exclude_product_ids` to drop items from a registered-recipient "
            "bundle when the user wants to swap something out."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "recipient_id": {"type": "INTEGER"},
                "budget": {"type": "NUMBER"},
                "event_type": {"type": "STRING"},
                "strategy": {
                    "type": "STRING",
                    "enum": ["max_score", "max_items", "balanced"],
                },
                "exclude_product_ids": {
                    "type": "ARRAY",
                    "items": {"type": "INTEGER"},
                    "description": "Product ids to drop (registered-recipient swap).",
                },
                "candidate_product_ids": {
                    "type": "ARRAY",
                    "items": {"type": "INTEGER"},
                    "description": "Product pool to optimize over when there is no recipient_id (stranger mode).",
                },
            },
            "required": ["budget"],
        },
    },
    {
        "name": "edit_gift_bundle",
        "description": (
            "Modify the bundle CURRENTLY shown and re-render it. The server starts from the "
            "current bundle, removes `remove_product_ids`, adds `add_product_ids`, then renders "
            "the exact result — you do NOT restate the items that stay. Use this whenever the "
            "user asks to remove, drop, swap, or add items to the existing bundle (whether it "
            "came from the gift builder or you built it earlier). Provide `budget` so match "
            "scores reflect the recipient."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "remove_product_ids": {"type": "ARRAY", "items": {"type": "INTEGER"}},
                "add_product_ids": {"type": "ARRAY", "items": {"type": "INTEGER"}},
                "budget": {"type": "NUMBER"},
                "event_type": {"type": "STRING"},
            },
        },
    },
    {
        "name": "get_giver_preferences",
        "description": (
            "Retrieve the current user's learned gifting preferences "
            "(what they like/avoid gifting). Call this before making recommendations."
        ),
    },
    {
        "name": "update_giver_preference",
        "description": (
            "Save or update a learned preference about the current user's gifting style. "
            "Call this when the user expresses a preference, e.g. "
            "'I never gift tech stuff' → avoid_category: electronics."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "preference_type": {
                    "type": "STRING",
                    "enum": [
                        "avoid_category", "avoid_tag",
                        "prefer_category", "prefer_tag", "general_note",
                    ],
                },
                "value": {
                    "type": "STRING",
                    "description": "Category slug, tag slug, or free text for general_note",
                },
                "context": {
                    "type": "STRING",
                    "description": "Why this preference was learned (conversation excerpt)",
                },
            },
            "required": ["preference_type", "value"],
        },
    },
    {
        "name": "find_users",
        "description": (
            "Look up registered GiftGraph users by (partial) username. Use this to resolve a "
            "person the user names or @-mentions into a numeric user id before calling "
            "`get_recipient_profile`. Returns id + username for each match (empty if none)."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING", "description": "Username or partial username"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "list_taxonomy",
        "description": (
            "List every category and tag that exists in GiftGraph (name + slug). Call this "
            "before inferring a recipient's interests so you only use categories/tags that "
            "actually exist — especially in stranger mode when building a temporary profile."
        ),
    },
    {
        "name": "present_temporary_profile",
        "description": (
            "Stranger mode only: show the user a temporary recipient profile — the categories "
            "and tags you think the recipient likes and dislikes — rendered as a profile card. "
            "Use the EXACT category/tag names returned by `list_taxonomy`. Call this to first "
            "show the profile, to update it as you learn more, and whenever the user asks what "
            "you think the recipient likes."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "summary": {"type": "STRING", "description": "1–2 sentence description of the recipient"},
                "liked_categories": {"type": "ARRAY", "items": {"type": "STRING"}},
                "disliked_categories": {"type": "ARRAY", "items": {"type": "STRING"}},
                "liked_tags": {"type": "ARRAY", "items": {"type": "STRING"}},
                "disliked_tags": {"type": "ARRAY", "items": {"type": "STRING"}},
            },
        },
    },
]


def execute_tool(tool_name, tool_input, giver_user, recipient_id=None, session_id=None):
    """
    Execute a tool call using the existing service layer.
    Each tool delegates to the same services the REST API uses — no duplication.
    Returns a JSON-serializable dict/list.
    """
    try:
        if tool_name == "search_products":
            return _search_products(tool_input)

        elif tool_name == "get_recipient_profile":
            return _get_recipient_profile(tool_input)

        elif tool_name == "get_recommendations":
            return _get_recommendations(tool_input, giver_user)

        elif tool_name == "optimize_gift_bundle":
            return _optimize_gift_bundle(tool_input, giver_user)

        elif tool_name == "edit_gift_bundle":
            return _edit_gift_bundle(tool_input, giver_user, recipient_id, session_id)

        elif tool_name == "get_giver_preferences":
            return _get_giver_preferences(giver_user)

        elif tool_name == "update_giver_preference":
            return _update_giver_preference(tool_input, giver_user)

        elif tool_name == "find_users":
            return _find_users(tool_input)

        elif tool_name == "list_taxonomy":
            return _list_taxonomy()

        elif tool_name == "present_temporary_profile":
            return _present_temporary_profile(tool_input)

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        return {"error": str(e)}


# ── Tool implementations ──────────────────────────────────────────────────────

def _search_products(tool_input):
    from apps.products.repositories import ProductRepository
    from apps.products.serializers import ProductRecommendationSerializer
    from apps.users.models import Category
    from apps.products.models import Tag

    query = tool_input.get('query', '').strip()
    if query:
        products = ProductRepository.full_text_search(query, limit=20)
    else:
        category_id = None
        category_slug = tool_input.get('category', '').strip()
        if category_slug:
            cat = Category.objects.filter(slug=category_slug).first()
            if cat:
                category_id = cat.id

        tag_slugs = tool_input.get('tag_slugs', [])
        tag_ids = None
        if tag_slugs:
            tag_ids = list(Tag.objects.filter(slug__in=tag_slugs).values_list('id', flat=True))

        products = ProductRepository.list_active(
            category_id=category_id,
            tag_ids=tag_ids,
            min_price=tool_input.get('min_price'),
            max_price=tool_input.get('max_price'),
        )[:20]

    return ProductRecommendationSerializer(products, many=True).data


def _get_recipient_profile(tool_input):
    from apps.users.services import UserService
    user_id = tool_input['user_id']
    data = UserService.get_public_profile(user_id)
    if data is None:
        return {"error": f"User {user_id} not found"}
    return data


def _get_recommendations(tool_input, giver_user):
    from apps.products.serializers import ProductRecommendationSerializer
    from apps.recommendations.services import RecommendationService

    scored = RecommendationService.get_recommendations(
        recipient_id=tool_input['recipient_id'],
        budget=Decimal(str(tool_input['budget'])),
        event_type=tool_input.get('event_type'),
        giver_user=giver_user,
        limit=tool_input.get('limit', 10),
    )

    if isinstance(scored, dict) and 'message' in scored:
        return scored

    return [
        {
            'product': ProductRecommendationSerializer(item['product']).data,
            'score': round(item['score'], 3),
            'explanation': item['explanation'],
        }
        for item in scored
    ]


def _optimize_gift_bundle(tool_input, giver_user):
    from apps.recommendations.services import RecommendationService

    strategy = tool_input.get('strategy', 'balanced')
    budget = Decimal(str(tool_input['budget']))
    recipient_id = tool_input.get('recipient_id')
    candidate_product_ids = tool_input.get('candidate_product_ids')

    if recipient_id:
        bundles = RecommendationService.get_bundles(
            recipient_id=recipient_id,
            budget=budget,
            event_type=tool_input.get('event_type'),
            giver_user=giver_user,
            exclude_product_ids=tool_input.get('exclude_product_ids'),
        )
    elif candidate_product_ids:
        bundles = RecommendationService.build_bundles_from_products(
            product_ids=candidate_product_ids,
            budget=budget,
        )
    else:
        return {"error": "Provide recipient_id, or candidate_product_ids for stranger mode."}

    if isinstance(bundles, dict) and 'message' in bundles:
        return bundles

    result = {strat: _bundle_result(bundle_data) for strat, bundle_data in bundles.items()}
    return result.get(strategy, result)


def _bundle_result(bundle):
    """Serialize a RecommendationService bundle dict into the tool-result shape the
    frontend renders (shared by optimize_gift_bundle and edit_gift_bundle)."""
    from apps.products.serializers import ProductRecommendationSerializer
    return {
        'items': [
            {
                'product': ProductRecommendationSerializer(item['product']).data,
                'score': round(item['score'], 3),
                'explanation': item['explanation'],
            }
            for item in bundle['items']
        ],
        'total_price': str(bundle['total_price']),
        'total_score': bundle['total_score'],
        'budget_utilization': bundle['budget_utilization'],
    }


def _edit_gift_bundle(tool_input, giver_user, recipient_id, session_id):
    """Apply a remove/add delta to the session's CURRENT bundle (the source of truth saved
    in message metadata) and re-render. Deterministic: the surviving items are taken from
    the saved bundle, not re-stated by the model."""
    from apps.recommendations.services import RecommendationService
    from .repositories import ChatRepository

    base_ids = ChatRepository.get_latest_bundle_product_ids(session_id) if session_id else []
    if not base_ids:
        return {"message": "There's no current bundle to edit yet — build one first."}

    remove = set(tool_input.get('remove_product_ids') or [])
    new_ids = [pid for pid in base_ids if pid not in remove]
    for pid in (tool_input.get('add_product_ids') or []):
        if pid not in new_ids:
            new_ids.append(pid)

    budget = tool_input.get('budget')
    bundle = RecommendationService.build_bundle_for_products(
        product_ids=new_ids,
        budget=Decimal(str(budget)) if budget is not None else None,
        recipient_id=recipient_id,
        event_type=tool_input.get('event_type'),
        giver_user=giver_user,
    )
    if not bundle:
        return {"message": "The edited bundle is empty."}
    return _bundle_result(bundle)


def _get_giver_preferences(giver_user):
    from apps.recommendations.repositories import GiftGiverPreferenceRepository
    from .serializers import GiftGiverPreferenceSerializer

    prefs = GiftGiverPreferenceRepository.get_for_user(giver_user.id)
    return GiftGiverPreferenceSerializer(prefs, many=True).data


def _update_giver_preference(tool_input, giver_user):
    from apps.chat.services import ChatService
    from .serializers import GiftGiverPreferenceSerializer

    pref = ChatService.update_giver_preference(
        user=giver_user,
        preference_type=tool_input['preference_type'],
        value=tool_input['value'],
        context=tool_input.get('context', ''),
    )
    return {
        "status": "saved",
        "preference": GiftGiverPreferenceSerializer(pref).data,
    }


def _find_users(tool_input):
    from apps.users.repositories import UserRepository
    query = tool_input.get('query', '').strip()
    if not query:
        return {"error": "Provide a username to search for."}
    users = UserRepository.search_by_username(query, limit=10)
    return [{'id': u.id, 'username': u.username} for u in users]


def _list_taxonomy():
    from apps.products.repositories import CategoryRepository, TagRepository
    return {
        'categories': [{'name': c.name, 'slug': c.slug} for c in CategoryRepository.get_all()],
        'tags': [{'name': t.name, 'slug': t.slug} for t in TagRepository.get_all()],
    }


def _present_temporary_profile(tool_input):
    """Echo the inferred stranger profile back so the frontend renders it as a card.
    Display-only — nothing is persisted (there is no registered recipient)."""
    keys = ['liked_categories', 'disliked_categories', 'liked_tags', 'disliked_tags']
    profile = {k: [str(v) for v in (tool_input.get(k) or [])] for k in keys}
    profile['summary'] = tool_input.get('summary', '')
    return profile
