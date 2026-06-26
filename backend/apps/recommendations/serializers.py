from rest_framework import serializers

from apps.products.serializers import ProductListSerializer


class RecommendationItemSerializer(serializers.Serializer):
    product = ProductListSerializer()
    score = serializers.FloatField()
    explanation = serializers.CharField()


class BundleItemSerializer(serializers.Serializer):
    items = RecommendationItemSerializer(many=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_score = serializers.FloatField()
    budget_utilization = serializers.CharField()
