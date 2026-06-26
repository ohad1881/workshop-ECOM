from django.urls import path

from .controllers import CategoryListController

urlpatterns = [
    path('', CategoryListController.as_view(), name='category-list'),
]
