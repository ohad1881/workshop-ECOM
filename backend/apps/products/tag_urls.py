from django.urls import path

from .controllers import TagListController

urlpatterns = [
    path('', TagListController.as_view(), name='tag-list'),
]
