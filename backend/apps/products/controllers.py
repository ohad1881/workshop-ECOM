from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import StandardPagination
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductSearchSerializer,
    TagSerializer,
)
from .services import CategoryService, ProductService, TagService


class CategoryListController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        limit = min(int(request.query_params.get('limit', 20)), 100)
        categories = CategoryService.list(query=q or None, limit=limit)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(categories, request)
        return paginator.get_paginated_response(CategorySerializer(page, many=True).data)


class TagListController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        limit = min(int(request.query_params.get('limit', 20)), 100)
        tags = TagService.list(query=q or None, limit=limit)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(tags, request)
        return paginator.get_paginated_response(TagSerializer(page, many=True).data)


class ProductListController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category_id = request.query_params.get('category_id')
        tag_ids_raw = request.query_params.get('tag_ids', '')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')

        tag_ids = (
            [int(t) for t in tag_ids_raw.split(',') if t.strip().isdigit()]
            if tag_ids_raw else None
        )

        products = ProductService.list_products(
            category_id=int(category_id) if category_id else None,
            tag_ids=tag_ids,
            min_price=float(min_price) if min_price else None,
            max_price=float(max_price) if max_price else None,
        )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(products, request)
        return paginator.get_paginated_response(ProductListSerializer(page, many=True).data)


class ProductDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        try:
            product = ProductService.get_product(product_id)
        except ValueError:
            return Response({'message': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductDetailSerializer(product).data)


class ProductSearchController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response([])
        limit = min(int(request.query_params.get('limit', 20)), 100)
        products = ProductService.search_products(q, limit=limit)
        return Response(ProductSearchSerializer(products, many=True).data)
