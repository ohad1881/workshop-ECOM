from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .controllers import (
    ChangePasswordController,
    LoginController,
    LogoutController,
    MeController,
    MePreferencesController,
    RegisterController,
)

urlpatterns = [
    path('register/', RegisterController.as_view(), name='auth-register'),
    path('login/', LoginController.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('logout/', LogoutController.as_view(), name='auth-logout'),
    path('me/', MeController.as_view(), name='auth-me'),
    path('me/preferences/', MePreferencesController.as_view(), name='auth-me-preferences'),
    path('change-password/', ChangePasswordController.as_view(), name='auth-change-password'),
]
