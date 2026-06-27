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
                  'is_self_gift', 'stranger_description', 'created_at', 'updated_at']


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'recipient_id', 'budget', 'event_type',
                  'is_self_gift', 'stranger_description', 'messages', 'created_at', 'updated_at']


class CreateSessionSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True, default='')
    recipient_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    budget = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, default=None
    )
    event_type = serializers.CharField(required=False, allow_blank=True, default='')
    is_self_gift = serializers.BooleanField(required=False, default=False)
    stranger_description = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        if not data.get('recipient_id') and not data.get('stranger_description') and not data.get('is_self_gift'):
            raise serializers.ValidationError(
                "Provide recipient_id, stranger_description, or set is_self_gift=true."
            )
        return data


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(allow_blank=False, trim_whitespace=True)
    mentioned_user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )


class GiftGiverPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftGiverPreference
        fields = ['id', 'preference_type', 'value', 'context', 'created_at']
