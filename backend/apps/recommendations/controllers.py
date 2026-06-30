from decimal import Decimal, InvalidOperation

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    GiftHistoryCreateSerializer,
    GiftHistorySerializer,
    GiftSuggestionsSerializer,
    RecommendationItemSerializer,
)
from .services import RecommendationService

# Effectively "no budget cap" — large enough to include the entire catalog when
# scoring a user's whole feed (vs. a real gift budget).
UNCAPPED_BUDGET = Decimal('1000000000')


def _parse_budget(value):
    try:
        budget = Decimal(str(value))
        if budget <= 0:
            raise ValueError()
        return budget
    except (InvalidOperation, ValueError, TypeError):
        return None


class GiftSuggestionsController(APIView):
    """
    Single endpoint for the gift builder: returns top-pick recommendations AND
    all three bundles from one scoring pass. The client renders every tab/strategy
    from this one response.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        budget = _parse_budget(request.query_params.get('budget'))
        if budget is None:
            return Response(
                {'message': 'budget is required and must be a positive number.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = request.query_params.get('event_type', '').strip() or None
        limit = min(int(request.query_params.get('limit', 20)), 50)

        try:
            result = RecommendationService.get_gift_suggestions(
                recipient_id=user_id,
                budget=budget,
                event_type=event_type,
                giver_user=request.user,
                limit=limit,
            )
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)

        if 'message' in result:
            return Response({'message': result['message'], 'recommendations': [], 'bundles': {}})

        return Response(GiftSuggestionsSerializer(result).data)


class RecommendedForMeController(APIView):
    """
    The current user's entire catalog scored against their own profile, sorted by
    match score — powers the products page "Recommended" tab. Self-gift scoring is
    triggered automatically (giver == recipient), so private wishlist data counts.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = min(int(request.query_params.get('limit', 200)), 500)

        result = RecommendationService.get_recommendations(
            recipient_id=request.user.id,
            budget=UNCAPPED_BUDGET,
            giver_user=request.user,
            limit=limit,
        )

        # No profile data yet → service returns a {'message': ..., 'items': []} dict.
        if isinstance(result, dict):
            return Response({'message': result['message'], 'results': []})

        return Response({'results': RecommendationItemSerializer(result, many=True).data})


class GiftHistoryController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = RecommendationService.get_gift_history_for_giver(request.user.id)
        return Response({'history': GiftHistorySerializer(history, many=True).data})

    def post(self, request):
        serializer = GiftHistoryCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            history = RecommendationService.finalize_gift_bundle(
                giver_user=request.user,
                recipient_id=serializer.validated_data.get('recipient_id'),
                recipient_stranger_name=serializer.validated_data.get('recipient_stranger_name'),
                budget=serializer.validated_data['budget'],
                event_type=serializer.validated_data.get('event_type'),
                strategy=serializer.validated_data['strategy'],
                items=serializer.validated_data['items'],
            )
        except ValueError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(GiftHistorySerializer(history).data, status=status.HTTP_201_CREATED)


class GiftHistoryDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, history_id):
        try:
            RecommendationService.delete_gift_history(history_id, request.user)
        except ValueError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_403_FORBIDDEN)

        return Response(status=status.HTTP_204_NO_CONTENT)
