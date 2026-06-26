from django.urls import path

from .controllers import ProductDetailController, ProductListController, ProductSearchController

urlpatterns = [
    path('', ProductListController.as_view(), name='product-list'),
    path('search/', ProductSearchController.as_view(), name='product-search'),
    path('<int:product_id>/', ProductDetailController.as_view(), name='product-detail'),
]
