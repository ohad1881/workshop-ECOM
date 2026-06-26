from rest_framework import serializers

from .models import ChatMessage, ChatSession, GiftGiverPreference


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'metadata', 'created_at']


class ChatSessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'recipient_id', 'budget', 'event_type',
                  'is_self_gift', 'created_at', 'updated_at']


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'recipient_id', 'budget', 'event_type',
                  'is_self_gift', 'messages', 'created_at', 'updated_at']


class CreateSessionSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True, default='')
    recipient_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    budget = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, default=None
    )
    event_type = serializers.CharField(required=False, allow_blank=True, default='')
    is_self_gift = serializers.BooleanField(required=False, default=False)


class GiftGiverPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftGiverPreference
        fields = ['id', 'preference_type', 'value', 'context', 'created_at']
