from django.apps import AppConfig


class RecommendationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # Package path is data.recommendations; app label defaults to 'recommendations'.
    name = 'data.recommendations'
