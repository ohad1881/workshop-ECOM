from django.urls import path

from .controllers import BundleController, RecommendationListController, SelfGiftController

urlpatterns = [
    path('for-user/<int:user_id>/', RecommendationListController.as_view(), name='recommendations'),
    path('bundle/<int:user_id>/', BundleController.as_view(), name='bundle'),
    path('self-gift/', SelfGiftController.as_view(), name='self-gift'),
]
