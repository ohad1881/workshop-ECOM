from decimal import Decimal, InvalidOperation

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import BundleItemSerializer, RecommendationItemSerializer
from .services import RecommendationService


def _parse_budget(value):
    try:
        budget = Decimal(str(value))
        if budget <= 0:
            raise ValueError()
        return budget
    except (InvalidOperation, ValueError, TypeError):
        return None


class RecommendationListController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        budget_raw = request.query_params.get('budget')
        budget = _parse_budget(budget_raw)
        if budget is None:
            return Response(
                {'message': 'budget is required and must be a positive number.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = request.query_params.get('event_type', '').strip() or None
        limit = min(int(request.query_params.get('limit', 10)), 50)

        try:
            scored = RecommendationService.get_recommendations(
                recipient_id=user_id,
                budget=budget,
                event_type=event_type,
                giver_user=request.user,
                limit=limit,
            )
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)

        if isinstance(scored, dict) and 'message' in scored:
            return Response(scored)

        return Response(RecommendationItemSerializer(scored, many=True).data)


class BundleController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        budget_raw = request.query_params.get('budget')
        budget = _parse_budget(budget_raw)
        if budget is None:
            return Response(
                {'message': 'budget is required and must be a positive number.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = request.query_params.get('event_type', '').strip() or None
        strategy = request.query_params.get('strategy', 'balanced')
        if strategy not in ('max_score', 'max_items', 'balanced'):
            strategy = 'balanced'

        try:
            bundles = RecommendationService.get_bundles(
                recipient_id=user_id,
                budget=budget,
                event_type=event_type,
                giver_user=request.user,
            )
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)

        if isinstance(bundles, dict) and 'message' in bundles:
            return Response(bundles)

        bundle = bundles[strategy]
        return Response(BundleItemSerializer(bundle).data)


class SelfGiftController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        budget_raw = request.query_params.get('budget')
        budget = _parse_budget(budget_raw)
        if budget is None:
            return Response(
                {'message': 'budget is required and must be a positive number.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = request.query_params.get('event_type', '').strip() or None
        strategy = request.query_params.get('strategy', 'balanced')
        if strategy not in ('max_score', 'max_items', 'balanced'):
            strategy = 'balanced'

        bundles = RecommendationService.get_bundles(
            recipient_id=request.user.id,
            budget=budget,
            event_type=event_type,
            giver_user=request.user,
            self_gift=True,
        )

        if isinstance(bundles, dict) and 'message' in bundles:
            return Response(bundles)

        return Response(BundleItemSerializer(bundles[strategy]).data)
