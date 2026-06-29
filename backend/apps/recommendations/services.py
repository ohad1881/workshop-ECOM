from dataclasses import dataclass, field
from decimal import Decimal

from django.db.models import Count

from apps.products.models import Tag
from apps.products.repositories import ProductRepository
from apps.users.repositories import UserRepository
from apps.wishlists.models import WishlistItem
from .constants import (
    EVENT_CATEGORY_MAP,
    MIN_RELEVANCE_THRESHOLD,
    QUANTITY_STRATEGY_THRESHOLD,
    STRATEGIES,
    STRATEGY_BALANCED,
    STRATEGY_MAX_ITEMS,
    STRATEGY_MAX_SCORE,
)
from .engine import compute_score
from .optimizer import optimize_gift_bundle
from .repositories import GiftGiverPreferenceRepository

_PUBLIC = WishlistItem.PrivacyLevel.PUBLIC


@dataclass
class ScoringContext:
    """Per-recipient facts precomputed once so compute_score stays query-free."""
    recipient_username: str
    preferred_category_ids: set = field(default_factory=set)
    excluded_category_ids: set = field(default_factory=set)
    wishlist_priority_by_product: dict = field(default_factory=dict)  # {product_id: priority}; public items (private too when self-gifting)
    preferred_tag_ids: set = field(default_factory=set)  # tags the recipient likes: interests + wishlisted-product tags
    max_wishlist_count: int = 1  # highest public wishlist count across all products (community-signal denominator)
    event_name: str = None  # e.g. "birthday"; None when no event selected
    event_relevant_cats: list = field(default_factory=list)  # category names that get an event boost
    giver_preferences: list = field(default_factory=list)  # giver's GiftGiverPreference rows (AI-learned avoid/prefer)


class RecommendationService:
    @staticmethod
    def _build_context(recipient_profile, event_type, giver_preferences, self_gift):
        """Run the handful of aggregate queries scoring needs, once per request."""
        user = recipient_profile.user

        # Category preferences are always applied (no privacy gate).
        preferred_category_ids = set(
            recipient_profile.preferred_categories.values_list('id', flat=True)
        )
        excluded_category_ids = set(
            recipient_profile.excluded_categories.values_list('id', flat=True)
        )

        # Recipient's wishlist: product → priority, in one query. 
        # Private items count only when self-gifting.
        wishlist_qs = WishlistItem.objects.filter(user=user)
        if not self_gift:
            wishlist_qs = wishlist_qs.filter(privacy=_PUBLIC)
        wishlist_priority_by_product = dict(
            wishlist_qs.values_list('product_id', 'priority')
        )

        # Tags the recipient likes: explicit interests + tags from wishlisted
        # products. Constant for the recipient, so compute it once here.
        preferred_tag_ids = set(recipient_profile.interests.values_list('id', flat=True))
        if wishlist_priority_by_product:
            preferred_tag_ids |= set(
                Tag.objects.filter(products__id__in=wishlist_priority_by_product.keys())
                .values_list('id', flat=True)
            )

        # Community signal denominator (most-wishlisted product), one query.
        row = (
            WishlistItem.objects.filter(privacy=_PUBLIC)
            .values('product')
            .annotate(c=Count('id'))
            .order_by('-c')
            .first()
        )
        max_wishlist_count = row['c'] if row else 1

        event_relevant_cats = (
            EVENT_CATEGORY_MAP.get(event_type.lower(), []) if event_type else []
        )

        return ScoringContext(
            recipient_username=user.username,
            preferred_category_ids=preferred_category_ids,
            excluded_category_ids=excluded_category_ids,
            wishlist_priority_by_product=wishlist_priority_by_product,
            preferred_tag_ids=preferred_tag_ids,
            max_wishlist_count=max_wishlist_count,
            event_name=event_type,
            event_relevant_cats=event_relevant_cats,
            giver_preferences=giver_preferences,
        )

    @staticmethod
    def _score_products(recipient_id, budget, event_type=None, giver_user=None):
        """
        Score and rank every active in-budget product for a recipient — the single
        scoring pass shared by the recommendation list, the bundles, and the
        combined gift-suggestions endpoint.

        Self-gift is detected automatically when the giver is the recipient: their
        private wishlist data is then used and the data-availability gate is skipped.

        Returns either a sorted list of scored-product dicts, or a {'message': ...}
        dict when the recipient has no profile data to recommend from.
        """
        recipient_profile = UserRepository.get_profile(recipient_id)
        if not recipient_profile:
            raise ValueError("Recipient not found")

        self_gift = bool(giver_user and giver_user.id == recipient_profile.user_id)

        if not self_gift:
            # Interests and category preferences are always usable; only the
            # wishlist is privacy-gated.
            has_usable_data = (
                recipient_profile.interests.exists()
                or recipient_profile.preferred_categories.exists()
                or recipient_profile.excluded_categories.exists()
                or recipient_profile.user.wishlist_items.filter(privacy=_PUBLIC).exists()
            )
            if not has_usable_data:
                return {'message': 'This user has no profile data for recommendations yet', 'items': []}

        giver_preferences = []
        if giver_user:
            giver_preferences = GiftGiverPreferenceRepository.get_for_user(giver_user.id)

        ctx = RecommendationService._build_context(
            recipient_profile, event_type, giver_preferences, self_gift,
        )

        # Excluded categories are filtered out here — never scored or suggested.
        products = ProductRepository.get_active_within_budget(
            budget, exclude_category_ids=ctx.excluded_category_ids,
        )

        scored = []
        for product in products:
            score, explanation = compute_score(product, ctx)
            scored.append({'product': product, 'score': score, 'explanation': explanation})

        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored

    @staticmethod
    def _build_bundles(scored, budget):
        """Run the knapsack optimizer for all three strategies over a scored pool."""
        # Premium pool: used by max_score and balanced (quality over quantity).
        premium_candidates = [p for p in scored if p['score'] >= MIN_RELEVANCE_THRESHOLD]
        # Quantity pool: used by max_items (wider net to fill budget with more gifts).
        quantity_candidates = [p for p in scored if p['score'] >= QUANTITY_STRATEGY_THRESHOLD]

        # If even the loose pool is empty there is nothing useful to return.
        if not quantity_candidates:
            return {
                'message': 'No relevant products found within this budget.',
                'items': [],
            }

        strategy_candidates = {
            STRATEGY_MAX_SCORE: premium_candidates,
            STRATEGY_BALANCED:  premium_candidates,
            STRATEGY_MAX_ITEMS: quantity_candidates,
        }

        budget_decimal = Decimal(str(budget))
        results = {}
        for strategy in STRATEGIES:
            candidates = strategy_candidates[strategy]
            bundle = optimize_gift_bundle(candidates, budget_decimal, strategy)
            total_price = sum(Decimal(str(p['product'].price)) for p in bundle)
            total_score = sum(p['score'] for p in bundle)
            results[strategy] = {
                'items': bundle,
                'total_price': total_price,
                'total_score': round(total_score, 2),
                'budget_utilization': (
                    f"{(total_price / budget_decimal * 100):.1f}%"
                    if budget_decimal > 0 else "0%"
                ),
            }
        return results

    @staticmethod
    def get_recommendations(recipient_id, budget, event_type=None,
                            giver_user=None, limit=20):
        """Top-N scored products for a recipient. Used by the AI chat tools."""
        scored = RecommendationService._score_products(
            recipient_id, budget, event_type, giver_user,
        )
        if isinstance(scored, dict):
            return scored
        return scored[:limit]

    @staticmethod
    def get_bundles(recipient_id, budget, event_type=None, giver_user=None):
        """All three knapsack bundles for a recipient. Used by the AI chat tools."""
        scored = RecommendationService._score_products(
            recipient_id, budget, event_type, giver_user,
        )
        if isinstance(scored, dict):
            return scored
        return RecommendationService._build_bundles(scored, budget)

    @staticmethod
    def get_gift_suggestions(recipient_id, budget, event_type=None,
                             giver_user=None, limit=20):
        """
        Combined payload for the gift builder: top-pick recommendations AND all
        three bundles from a SINGLE scoring pass. The frontend makes one call and
        switches tabs/strategies client-side — no further requests.
        """
        scored = RecommendationService._score_products(
            recipient_id, budget, event_type, giver_user,
        )
        if isinstance(scored, dict):
            return scored

        bundles = RecommendationService._build_bundles(scored, budget)
        # _build_bundles returns a {'message': ...} dict when no candidates qualify;
        # in that case there are no bundles to show, but top picks may still exist.
        if 'message' in bundles:
            bundles = {}

        return {
            'recommendations': scored[:limit],
            'bundles': bundles,
        }
