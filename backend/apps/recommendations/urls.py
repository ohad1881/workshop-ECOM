from django.urls import path

from .controllers import GiftSuggestionsController, RecommendedForMeController

urlpatterns = [
    path('gift-suggestions/<int:user_id>/', GiftSuggestionsController.as_view(), name='gift-suggestions'),
    path('for-me/', RecommendedForMeController.as_view(), name='recommended-for-me'),
]
