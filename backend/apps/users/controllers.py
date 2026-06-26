from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from common.constants import EVENT_TYPES, GIFT_STRATEGIES
from .repositories import UserRepository
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSettingsUpdateSerializer,
)
from .services import AuthService, UserService


def _user_avatar_url(request, user):
    if user.avatar:
        return request.build_absolute_uri(user.avatar.url)
    return None


class RegisterController(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {'id': user.id, 'email': user.email, 'username': user.username},
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginController(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutController(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh', ''))
            token.blacklist()
        except TokenError:
            return Response({'message': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = user.profile
        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'avatar': _user_avatar_url(request, user),
            'preferences': {
                'bio': user.bio,
                'interest_ids': list(profile.interests.values_list('id', flat=True)),
                'preferred_category_ids': list(profile.preferred_categories.values_list('id', flat=True)),
                'excluded_category_ids': list(profile.excluded_categories.values_list('id', flat=True)),
                'interests_privacy': profile.interests_privacy,
                'preferences_privacy': profile.preferences_privacy,
            },
        })

    def patch(self, request):
        serializer = UserSettingsUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'avatar': _user_avatar_url(request, user),
        })


class MePreferencesController(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = request.user.profile
        UserRepository.update_profile(profile, **serializer.validated_data)
        # Re-fetch to get updated bio from user row
        user = UserRepository.get_by_id(request.user.id)
        profile = user.profile
        return Response({
            'bio': user.bio,
            'interest_ids': list(profile.interests.values_list('id', flat=True)),
            'preferred_category_ids': list(profile.preferred_categories.values_list('id', flat=True)),
            'excluded_category_ids': list(profile.excluded_categories.values_list('id', flat=True)),
            'interests_privacy': profile.interests_privacy,
            'preferences_privacy': profile.preferences_privacy,
        })


class ChangePasswordController(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            AuthService.change_password(
                request.user,
                serializer.validated_data['old_password'],
                serializer.validated_data['new_password'],
            )
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Password updated.'})


class UserSearchController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response([])
        limit = min(int(request.query_params.get('limit', 20)), 100)
        users = UserRepository.search_by_username(q, limit=limit)
        return Response([
            {'id': u.id, 'username': u.username, 'avatar': _user_avatar_url(request, u)}
            for u in users
        ])


class UserDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        data = UserService.get_public_profile(user_id)
        if data is None:
            return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)


class UserWishlistController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        from apps.wishlists.services import WishlistService
        from apps.wishlists.serializers import WishlistItemSerializer
        items = WishlistService.get_public_wishlist(user_id)
        return Response(WishlistItemSerializer(items, many=True).data)


class MetadataController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'event_types': EVENT_TYPES,
            'gift_strategies': GIFT_STRATEGIES,
        })
