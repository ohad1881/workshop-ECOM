from django.urls import path

from .controllers import WishlistController, WishlistItemController

urlpatterns = [
    path('', WishlistController.as_view(), name='wishlist'),
    path('<int:item_id>/', WishlistItemController.as_view(), name='wishlist-item'),
]
