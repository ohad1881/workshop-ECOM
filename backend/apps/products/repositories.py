from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

from apps.users.models import Category
from .models import Product, Tag


class CategoryRepository:
    @staticmethod
    def get_all():
        return Category.objects.all().order_by('name')

    @staticmethod
    def search(query, limit=20):
        return Category.objects.filter(name__icontains=query).order_by('name')[:limit]


class TagRepository:
    @staticmethod
    def get_all():
        return Tag.objects.all().order_by('name')

    @staticmethod
    def search(query, limit=20):
        return Tag.objects.filter(name__icontains=query).order_by('name')[:limit]


class ProductRepository:
    @staticmethod
    def get_by_id(product_id):
        return (
            Product.objects
            .select_related('category')
            .prefetch_related('tags')
            .filter(id=product_id, is_active=True)
            .first()
        )

    @staticmethod
    def list_active(category_id=None, tag_ids=None, min_price=None, max_price=None):
        qs = Product.objects.select_related('category').prefetch_related('tags').filter(is_active=True)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if min_price is not None:
            qs = qs.filter(price__gte=min_price)
        if max_price is not None:
            qs = qs.filter(price__lte=max_price)
        if tag_ids:
            qs = qs.filter(tags__id__in=tag_ids).distinct()
        return qs

    @staticmethod
    def full_text_search(query, limit=20):
        return (
            Product.objects
            .filter(is_active=True)
            .annotate(rank=SearchRank(SearchVector('name', 'description'), SearchQuery(query)))
            .filter(rank__gt=0)
            .order_by('-rank')[:limit]
        )

    @staticmethod
    def get_active_within_budget(budget):
        """Used by the recommendation engine."""
        return (
            Product.objects
            .select_related('category')
            .prefetch_related('tags')
            .filter(is_active=True, price__lte=budget)
        )
