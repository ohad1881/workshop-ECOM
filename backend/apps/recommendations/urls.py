from django.urls import path

from .controllers import GiftSuggestionsController

urlpatterns = [
    path('gift-suggestions/<int:user_id>/', GiftSuggestionsController.as_view(), name='gift-suggestions'),
]
