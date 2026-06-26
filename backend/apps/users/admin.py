from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Category, User, UserProfile


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    filter_horizontal = ('interests', 'preferred_categories', 'excluded_categories')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('username', 'email')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Extra', {'fields': ('bio', 'avatar')}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'interests_privacy', 'preferences_privacy', 'created_at')
    list_filter = ('interests_privacy', 'preferences_privacy')
    search_fields = ('user__username', 'user__email')
    filter_horizontal = ('interests', 'preferred_categories', 'excluded_categories')
