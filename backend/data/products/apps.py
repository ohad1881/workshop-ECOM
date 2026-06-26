from django.apps import AppConfig


class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # Package path is data.products; app label defaults to 'products'.
    name = 'data.products'
