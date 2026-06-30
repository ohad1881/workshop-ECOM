from django.urls import path

from .controllers import (
    GiftHistoryController,
    GiftHistoryDetailController,
    GiftSuggestionsController,
    RecommendedForMeController,
)

urlpatterns = [
    path('gift-suggestions/<int:user_id>/', GiftSuggestionsController.as_view(), name='gift-suggestions'),
    path('for-me/', RecommendedForMeController.as_view(), name='recommended-for-me'),
    path('finalize/', GiftHistoryController.as_view(), name='gift-history-finalize'),
    path('history/', GiftHistoryController.as_view(), name='gift-history-list'),
    path('history/<int:history_id>/', GiftHistoryDetailController.as_view(), name='gift-history-detail'),
]
