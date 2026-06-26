from django.apps import AppConfig


class ChatConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # Package path is data.chat; app label defaults to 'chat'.
    name = 'data.chat'
