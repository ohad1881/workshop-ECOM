from rest_framework import serializers

from apps.products.serializers import ProductListSerializer
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'note', 'privacy', 'priority', 'added_at']


class AddWishlistItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    privacy = serializers.ChoiceField(choices=['public', 'private'], default='public')
    priority = serializers.IntegerField(min_value=0, max_value=5, default=0)
    note = serializers.CharField(required=False, allow_blank=True, max_length=200, default='')


class UpdateWishlistItemSerializer(serializers.Serializer):
    privacy = serializers.ChoiceField(choices=['public', 'private'], required=False)
    priority = serializers.IntegerField(min_value=0, max_value=5, required=False)
    note = serializers.CharField(required=False, allow_blank=True, max_length=200)
