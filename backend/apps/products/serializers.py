from rest_framework import serializers

from apps.users.models import Category
from .models import Product, Tag


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class ProductListSerializer(serializers.ModelSerializer):
    """Compact representation for list views."""
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category_id', 'image_url', 'is_active']


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full representation for detail view."""
    tag_ids = serializers.PrimaryKeyRelatedField(source='tags', many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category_id', 'tag_ids',
                  'image_url', 'purchase_url', 'is_active']


class ProductSearchSerializer(serializers.ModelSerializer):
    """Minimal representation for search results."""
    class Meta:
        model = Product
        fields = ['id', 'name', 'price']


class ProductRecommendationSerializer(serializers.ModelSerializer):
    """Used by the recommendation engine and AI tools."""
    category_name = serializers.CharField(source='category.name', default=None)
    tag_names = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category_id', 'category_name',
                  'tag_names', 'image_url', 'purchase_url']

    def get_tag_names(self, obj):
        return list(obj.tags.values_list('name', flat=True))
