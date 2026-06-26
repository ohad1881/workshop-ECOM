from django.contrib import admin

from .models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'privacy', 'priority', 'added_at')
    list_filter = ('privacy',)
    search_fields = ('user__username', 'product__name')
    ordering = ('-added_at',)
