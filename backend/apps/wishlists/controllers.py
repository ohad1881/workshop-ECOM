from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AddWishlistItemSerializer, UpdateWishlistItemSerializer, WishlistItemSerializer
from .services import WishlistConflictError, WishlistService


class WishlistController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = WishlistService.get_own_wishlist(request.user.id)
        return Response(WishlistItemSerializer(items, many=True).data)

    def post(self, request):
        serializer = AddWishlistItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        try:
            item = WishlistService.add_item(
                user_id=request.user.id,
                product_id=d['product_id'],
                privacy=d['privacy'],
                priority=d['priority'],
                note=d['note'],
            )
        except WishlistConflictError as e:
            return Response({'message': str(e)}, status=status.HTTP_409_CONFLICT)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(WishlistItemSerializer(item).data, status=status.HTTP_201_CREATED)


class WishlistItemController(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        serializer = UpdateWishlistItemSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            item = WishlistService.update_item(
                item_id=item_id,
                user_id=request.user.id,
                **serializer.validated_data,
            )
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as e:
            return Response({'message': str(e)}, status=status.HTTP_403_FORBIDDEN)
        return Response(WishlistItemSerializer(item).data)

    def delete(self, request, item_id):
        try:
            WishlistService.remove_item(item_id=item_id, user_id=request.user.id)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as e:
            return Response({'message': str(e)}, status=status.HTTP_403_FORBIDDEN)
        return Response(status=status.HTTP_204_NO_CONTENT)
