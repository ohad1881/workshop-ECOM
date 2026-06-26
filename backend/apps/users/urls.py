from django.urls import path

from .controllers import UserDetailController, UserSearchController, UserWishlistController

urlpatterns = [
    path('search/', UserSearchController.as_view(), name='user-search'),
    path('<int:user_id>/', UserDetailController.as_view(), name='user-detail'),
    path('<int:user_id>/wishlist/', UserWishlistController.as_view(), name='user-wishlist'),
]
