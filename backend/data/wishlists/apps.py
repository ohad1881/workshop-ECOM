from django.apps import AppConfig


class WishlistsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # Package path is data.wishlists; app label defaults to 'wishlists'.
    name = 'data.wishlists'
