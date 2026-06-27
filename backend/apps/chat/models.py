from django.db import models

from apps.users.models import User


class ChatSession(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    recipient = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='gift_sessions'
    )
    title = models.CharField(max_length=255, blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    event_type = models.CharField(max_length=50, blank=True)
    is_self_gift = models.BooleanField(default=False)
    stranger_description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    MAX_MESSAGES_PER_SESSION = 50

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Session {self.id} by {self.owner.username}"


class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        ASSISTANT = 'assistant', 'Assistant'
        SYSTEM = 'system', 'System'

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)  # Recommended product IDs, scores, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role} message in session {self.session_id}"


class GiftGiverPreference(models.Model):
    """AI-learned preferences about how a user likes to give gifts."""

    class PreferenceType(models.TextChoices):
        AVOID_CATEGORY = 'avoid_category', 'Avoid Category'
        AVOID_TAG = 'avoid_tag', 'Avoid Tag'
        PREFER_CATEGORY = 'prefer_category', 'Prefer Category'
        PREFER_TAG = 'prefer_tag', 'Prefer Tag'
        GENERAL_NOTE = 'general_note', 'General Note'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='giver_preferences')
    preference_type = models.CharField(max_length=20, choices=PreferenceType.choices)
    value = models.CharField(max_length=255)  # Category slug, tag name, or free text
    context = models.TextField(blank=True)    # Why the AI learned this
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'preference_type', 'value')

    def __str__(self):
        return f"{self.user.username}: {self.preference_type} = {self.value}"
