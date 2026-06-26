from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # Package path is data.users; app label defaults to 'users'.
    name = 'data.users'
