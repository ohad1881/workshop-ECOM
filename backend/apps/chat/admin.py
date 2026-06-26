from django.contrib import admin

from .models import ChatMessage, ChatSession, GiftGiverPreference


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('role', 'content', 'created_at')
    can_delete = False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'owner', 'recipient', 'budget', 'event_type', 'is_self_gift', 'created_at')
    list_filter = ('is_self_gift', 'event_type')
    search_fields = ('owner__username', 'recipient__username')
    inlines = (ChatMessageInline,)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'role', 'content_preview', 'created_at')
    list_filter = ('role',)
    search_fields = ('session__owner__username', 'content')

    def content_preview(self, obj):
        return obj.content[:80]
    content_preview.short_description = 'Content'


@admin.register(GiftGiverPreference)
class GiftGiverPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'preference_type', 'value', 'created_at')
    list_filter = ('preference_type',)
    search_fields = ('user__username', 'value')
