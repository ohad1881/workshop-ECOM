from django.contrib import admin

from .models import GiftHistory


@admin.register(GiftHistory)
class GiftHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'giver', 'recipient_display', 'event_type', 'strategy', 'total_price', 'created_at')
    list_filter = ('event_type', 'strategy', 'created_at')
    search_fields = ('giver__username', 'recipient__username', 'recipient_stranger_name')
    readonly_fields = ('created_at', 'total_price', 'items')

    def recipient_display(self, obj):
        return obj.recipient.username if obj.recipient else obj.recipient_stranger_name or '—'
    recipient_display.short_description = 'Recipient'
