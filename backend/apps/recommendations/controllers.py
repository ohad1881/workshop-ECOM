from decimal import Decimal, InvalidOperation

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import GiftSuggestionsSerializer
from .services import RecommendationService


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
