from apps.chat.models import GiftGiverPreference
from .constants import (
    CATEGORY_WEIGHT,
    COMMUNITY_WEIGHT,
    EVENT_WEIGHT,
    GIVER_PREFERENCE_WEIGHT,
    MAX_PRIORITY,
    TAG_OVERLAP_WEIGHT,
    WISHLIST_WEIGHT,
)

_PrefType = GiftGiverPreference.PreferenceType

# Sum of all weights — used as the denominator for normalization.
_TOTAL_WEIGHT = (
    WISHLIST_WEIGHT + CATEGORY_WEIGHT + TAG_OVERLAP_WEIGHT
    + COMMUNITY_WEIGHT + EVENT_WEIGHT + GIVER_PREFERENCE_WEIGHT
)


def compute_score(product, ctx):
    """
    Score a single product for a recipient (0.0 – 1.0).

    Pure in-memory: every per-recipient fact it needs is precomputed once by the
    caller and passed in via `ctx` (a ScoringContext). This function issues no
    DB queries — `product.category` is select_related and `product.tags` is
    prefetched, and community counts arrive as the `public_wishlist_count`
    annotation on the product.

    Returns: (score: float, explanation: str)
    """
    score = 0.0
    explanations = []

    # ── 1. Wishlist match (WISHLIST_WEIGHT) ─────────────────────────────────
    if product.id in ctx.wishlist_priority_by_product:
        priority = ctx.wishlist_priority_by_product[product.id]
        priority_factor = max(priority, 1) / MAX_PRIORITY
        score += WISHLIST_WEIGHT * priority_factor
        explanations.append(
            f"On {ctx.recipient_username}'s wishlist "
            f"(priority {priority}/{MAX_PRIORITY})"
        )

    # ── 2. Category preference match (CATEGORY_WEIGHT) ──────────────────────
    # Excluded categories were already filtered out before scoring.
    if product.category_id in ctx.preferred_category_ids:
        score += CATEGORY_WEIGHT
        explanations.append(f"Matches interest in {product.category.name}")

    # ── 3. Tag overlap with the recipient's liked tags (TAG_OVERLAP_WEIGHT) ──
    # Liked tags = explicit interests + tags from wishlisted products.
    product_tag_ids = {tag.id for tag in product.tags.all()}
    if product_tag_ids and ctx.preferred_tag_ids:
        overlap_ids = product_tag_ids & ctx.preferred_tag_ids
        if overlap_ids:
            tag_score = len(overlap_ids) / len(product_tag_ids)
            score += TAG_OVERLAP_WEIGHT * min(tag_score, 1.0)
            matching_names = [
                tag.name for tag in product.tags.all() if tag.id in overlap_ids
            ]
            explanations.append(f"Matches tags they like: {', '.join(matching_names)}")

    # ── 4. Community signal (COMMUNITY_WEIGHT) ───────────────────────────────
    wishlist_count = getattr(product, 'public_wishlist_count', 0)
    community_score = wishlist_count / max(ctx.max_wishlist_count, 1)
    score += COMMUNITY_WEIGHT * community_score
    if wishlist_count > 1:
        explanations.append(f"Popular: wishlisted by {wishlist_count} users")

    # ── 5. Event relevance (EVENT_WEIGHT) ────────────────────────────────────
    if ctx.event_relevant_cats and product.category:
        if product.category.name.lower() in ctx.event_relevant_cats:
            score += EVENT_WEIGHT
            explanations.append(f"Great for {ctx.event_name} events")

    # ── 6. Giver preference adjustment (GIVER_PREFERENCE_WEIGHT) ────────────
    if ctx.giver_preferences:
        giver_boost = 0.0
        product_tag_slugs = {tag.slug for tag in product.tags.all()}
        for pref in ctx.giver_preferences:
            if pref.preference_type == _PrefType.AVOID_CATEGORY and product.category:
                if product.category.slug == pref.value:
                    giver_boost -= 1.0
                    explanations.append(f"You usually avoid gifting {product.category.name}")
            elif pref.preference_type == _PrefType.AVOID_TAG:
                if pref.value in product_tag_slugs:
                    giver_boost -= 0.5
            elif pref.preference_type == _PrefType.PREFER_CATEGORY and product.category:
                if product.category.slug == pref.value:
                    giver_boost += 1.0
                    explanations.append("Matches your preferred gifting style")
            elif pref.preference_type == _PrefType.PREFER_TAG:
                if pref.value in product_tag_slugs:
                    giver_boost += 0.5
        score += GIVER_PREFERENCE_WEIGHT * max(-1.0, min(giver_boost, 1.0))

    normalized = max(0.0, min(score / _TOTAL_WEIGHT, 1.0))
    explanation = "; ".join(explanations) if explanations else "General recommendation"
    return normalized, explanation
