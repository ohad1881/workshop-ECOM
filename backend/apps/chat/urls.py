from django.urls import path

from .controllers import (
    ChatMessageController,
    ChatSessionDetailController,
    ChatSessionListController,
)

urlpatterns = [
    path('sessions/', ChatSessionListController.as_view(), name='chat-session-list'),
    path(
        'sessions/<int:session_id>/',
        ChatSessionDetailController.as_view(),
        name='chat-session-detail',
    ),
    path(
        'sessions/<int:session_id>/messages/',
        ChatMessageController.as_view(),
        name='chat-session-message',
    ),
]
