from django.db.models import Count

from apps.products.models import Tag
from apps.wishlists.models import WishlistItem
from .constants import (
    CATEGORY_WEIGHT,
    COMMUNITY_WEIGHT,
    EVENT_CATEGORY_MAP,
    EVENT_WEIGHT,
    GIVER_PREFERENCE_WEIGHT,
    MAX_PRIORITY,
    TAG_OVERLAP_WEIGHT,
    WISHLIST_WEIGHT,
)

# Sum of all weights — used as the denominator for normalization.
_TOTAL_WEIGHT = (
    WISHLIST_WEIGHT + CATEGORY_WEIGHT + TAG_OVERLAP_WEIGHT
    + COMMUNITY_WEIGHT + EVENT_WEIGHT + GIVER_PREFERENCE_WEIGHT
)


def compute_score(product, recipient_profile, event_type=None,
                  giver_preferences=None, max_wishlist_count=None):
    """
    Score a single product for a recipient (0.0 – 1.0).

    max_wishlist_count: precomputed across all products by the caller to avoid
    an N+1 query on the community signal.

    Returns: (score: float, explanation: str)
    """
    score = 0.0
    explanations = []

    # ── 1. Wishlist match (WISHLIST_WEIGHT) ─────────────────────────────────
    wishlist_item = recipient_profile.user.wishlist_items.filter(
        product=product, privacy='public'
    ).first()
    if wishlist_item:
        priority_factor = max(wishlist_item.priority, 1) / MAX_PRIORITY
        score += WISHLIST_WEIGHT * priority_factor
        explanations.append(
            f"On {recipient_profile.user.username}'s wishlist "
            f"(priority {wishlist_item.priority}/{MAX_PRIORITY})"
        )

    # ── 2. Category preference match (CATEGORY_WEIGHT) ──────────────────────
    if product.category in recipient_profile.preferred_categories.all():
        score += CATEGORY_WEIGHT
        explanations.append(f"Matches interest in {product.category.name}")
    elif product.category in recipient_profile.excluded_categories.all():
        score -= 0.15
        explanations.append(f"In excluded category: {product.category.name}")

    # ── 3. Tag overlap with recipient's wishlist products (TAG_OVERLAP_WEIGHT)
    product_tag_ids = set(product.tags.values_list('id', flat=True))
    if product_tag_ids:
        wishlist_product_ids = recipient_profile.user.wishlist_items.filter(
            privacy='public'
        ).values_list('product_id', flat=True)
        wishlist_tag_ids = set(
            Tag.objects.filter(products__id__in=wishlist_product_ids)
            .values_list('id', flat=True)
        )
        if wishlist_tag_ids:
            overlap_ids = product_tag_ids & wishlist_tag_ids
            tag_score = len(overlap_ids) / len(product_tag_ids)
            score += TAG_OVERLAP_WEIGHT * min(tag_score, 1.0)
            if overlap_ids:
                matching_names = Tag.objects.filter(
                    id__in=overlap_ids
                ).values_list('name', flat=True)
                explanations.append(f"Tags match wishlist: {', '.join(matching_names)}")

    # ── 4. Community signal (COMMUNITY_WEIGHT) ───────────────────────────────
    wishlist_count = product.wishlisted_by.filter(privacy='public').count()
    if max_wishlist_count is None:
        row = (
            WishlistItem.objects.filter(privacy='public')
            .values('product')
            .annotate(c=Count('id'))
            .order_by('-c')
            .first()
        )
        max_wishlist_count = row['c'] if row else 1
    community_score = wishlist_count / max(max_wishlist_count, 1)
    score += COMMUNITY_WEIGHT * community_score
    if wishlist_count > 1:
        explanations.append(f"Popular: wishlisted by {wishlist_count} users")

    # ── 5. Event relevance (EVENT_WEIGHT) ────────────────────────────────────
    if event_type and product.category:
        relevant_cats = EVENT_CATEGORY_MAP.get(event_type.lower(), [])
        if product.category.name.lower() in relevant_cats:
            score += EVENT_WEIGHT
            explanations.append(f"Great for {event_type} events")

    # ── 6. Giver preference adjustment (GIVER_PREFERENCE_WEIGHT) ────────────
    if giver_preferences:
        giver_boost = 0.0
        for pref in giver_preferences:
            if pref.preference_type == 'avoid_category' and product.category:
                if product.category.slug == pref.value:
                    giver_boost -= 1.0
                    explanations.append(f"You usually avoid gifting {product.category.name}")
            elif pref.preference_type == 'avoid_tag':
                if product.tags.filter(slug=pref.value).exists():
                    giver_boost -= 0.5
            elif pref.preference_type == 'prefer_category' and product.category:
                if product.category.slug == pref.value:
                    giver_boost += 1.0
                    explanations.append("Matches your preferred gifting style")
            elif pref.preference_type == 'prefer_tag':
                if product.tags.filter(slug=pref.value).exists():
                    giver_boost += 0.5
        score += GIVER_PREFERENCE_WEIGHT * max(-1.0, min(giver_boost, 1.0))

    normalized = max(0.0, min(score / _TOTAL_WEIGHT, 1.0))
    explanation = "; ".join(explanations) if explanations else "General recommendation"
    return normalized, explanation
