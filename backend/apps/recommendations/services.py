from decimal import Decimal

from django.db.models import Count

from apps.products.repositories import ProductRepository
from apps.users.repositories import UserRepository
from apps.wishlists.models import WishlistItem
from .engine import compute_score
from .optimizer import optimize_gift_bundle
from .repositories import GiftGiverPreferenceRepository


class RecommendationService:
    @staticmethod
    def get_recommendations(recipient_id, budget, event_type=None,
                            giver_user=None, limit=20, self_gift=False):
        """
        Score and rank products for a recipient within budget.
        Called by both the REST API controllers and the AI tools (no duplication).

        self_gift=True: recipient is the giver themselves — all profile data is used,
        including private preferences.
        """
        recipient_profile = UserRepository.get_profile(recipient_id)
        if not recipient_profile:
            raise ValueError("Recipient not found")

        if not self_gift:
            has_public_data = (
                (recipient_profile.interests_privacy == 'public'
                 and recipient_profile.interests.exists())
                or (recipient_profile.preferences_privacy == 'public'
                    and recipient_profile.preferred_categories.exists())
                or recipient_profile.user.wishlist_items.filter(privacy='public').exists()
            )
            if not has_public_data:
                return {'message': 'This user has no public profile data for recommendations', 'items': []}

        giver_preferences = []
        if giver_user:
            giver_preferences = GiftGiverPreferenceRepository.get_for_user(giver_user.id)

        products = ProductRepository.get_active_within_budget(budget)

        # Precompute community signal denominator once to avoid N+1
        row = (
            WishlistItem.objects.filter(privacy='public')
            .values('product')
            .annotate(c=Count('id'))
            .order_by('-c')
            .first()
        )
        max_wishlist_count = row['c'] if row else 1

        scored = []
        for product in products:
            score, explanation = compute_score(
                product, recipient_profile, event_type, giver_preferences, max_wishlist_count
            )
            scored.append({'product': product, 'score': score, 'explanation': explanation})

        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored[:limit]

    @staticmethod
    def get_bundles(recipient_id, budget, event_type=None, giver_user=None, self_gift=False):
        """
        Run the knapsack optimizer for all three strategies and return all bundles.
        """
        scored = RecommendationService.get_recommendations(
            recipient_id=recipient_id,
            budget=budget,
            event_type=event_type,
            giver_user=giver_user,
            limit=100,
            self_gift=self_gift,
        )

        if isinstance(scored, dict) and 'message' in scored:
            return scored

        budget_decimal = Decimal(str(budget))
        results = {}
        for strategy in ('max_score', 'max_items', 'balanced'):
            bundle = optimize_gift_bundle(scored, budget_decimal, strategy)
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
