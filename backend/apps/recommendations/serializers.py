from rest_framework import serializers

from apps.products.serializers import ProductListSerializer
from .models import GiftHistory


class RecommendationItemSerializer(serializers.Serializer):
    product = ProductListSerializer()
    score = serializers.FloatField()
    explanation = serializers.CharField()


class BundleItemSerializer(serializers.Serializer):
    items = RecommendationItemSerializer(many=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_score = serializers.FloatField()
    budget_utilization = serializers.CharField()


class GiftSuggestionsSerializer(serializers.Serializer):
    recommendations = RecommendationItemSerializer(many=True)
    bundles = serializers.DictField(child=BundleItemSerializer())


class GiftHistoryItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    image_url = serializers.URLField(allow_null=True, required=False)
    category_id = serializers.IntegerField()
    # Snapshot of the match score/explanation at save time (older rows predate this
    # field, hence the defaults) — lets reopening a bundle for editing show real
    # match data without re-scoring against the recipient.
    score = serializers.FloatField(required=False, default=0.0)
    explanation = serializers.CharField(required=False, allow_blank=True, default='')


class GiftHistorySerializer(serializers.ModelSerializer):
    giver = serializers.SerializerMethodField()
    recipient = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    items = GiftHistoryItemSerializer(many=True)

    class Meta:
        model = GiftHistory
        fields = [
            'id',
            'giver',
            'recipient',
            'recipient_name',
            'recipient_stranger_name',
            'budget',
            'event_type',
            'strategy',
            'total_price',
            'items',
            'created_at',
        ]

    def get_giver(self, obj):
        return {'id': obj.giver.id, 'username': obj.giver.username}

    def get_recipient(self, obj):
        if obj.recipient:
            return {'id': obj.recipient.id, 'username': obj.recipient.username}
        return None

    def get_recipient_name(self, obj):
        return obj.recipient.username if obj.recipient else obj.recipient_stranger_name


class GiftHistoryCreateItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    score = serializers.FloatField(required=False, default=0.0)
    explanation = serializers.CharField(required=False, allow_blank=True, default='')


class GiftHistoryCreateSerializer(serializers.Serializer):
    recipient_id = serializers.IntegerField(required=False, allow_null=True)
    recipient_stranger_name = serializers.CharField(required=False, allow_blank=True)
    budget = serializers.DecimalField(max_digits=12, decimal_places=2)
    event_type = serializers.CharField(required=False, allow_blank=True)
    strategy = serializers.CharField(max_length=50)
    items = GiftHistoryCreateItemSerializer(many=True, min_length=1)

    def validate(self, attrs):
        if not attrs.get('recipient_id') and not attrs.get('recipient_stranger_name'):
            raise serializers.ValidationError(
                'Either recipient_id or recipient_stranger_name is required.',
            )
        return attrs
