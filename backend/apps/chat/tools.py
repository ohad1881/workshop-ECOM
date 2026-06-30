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
            "Run the knapsack optimizer to find the best combination of gifts within budget."
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
            },
            "required": ["recipient_id", "budget"],
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
]


def execute_tool(tool_name, tool_input, giver_user, recipient_id=None):
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

        elif tool_name == "get_giver_preferences":
            return _get_giver_preferences(giver_user)

        elif tool_name == "update_giver_preference":
            return _update_giver_preference(tool_input, giver_user)

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
    from apps.products.serializers import ProductRecommendationSerializer
    from apps.recommendations.services import RecommendationService

    strategy = tool_input.get('strategy', 'balanced')
    bundles = RecommendationService.get_bundles(
        recipient_id=tool_input['recipient_id'],
        budget=Decimal(str(tool_input['budget'])),
        event_type=tool_input.get('event_type'),
        giver_user=giver_user,
    )

    if isinstance(bundles, dict) and 'message' in bundles:
        return bundles

    result = {}
    for strat, bundle_data in bundles.items():
        result[strat] = {
            'items': [
                {
                    'product': ProductRecommendationSerializer(item['product']).data,
                    'score': round(item['score'], 3),
                    'explanation': item['explanation'],
                }
                for item in bundle_data['items']
            ],
            'total_price': str(bundle_data['total_price']),
            'total_score': bundle_data['total_score'],
            'budget_utilization': bundle_data['budget_utilization'],
        }

    return result.get(strategy, result)


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
