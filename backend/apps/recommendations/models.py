from django.db import models

from apps.users.models import User


class GiftHistory(models.Model):
    giver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='gift_histories_given',
    )
    recipient = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='gift_histories_received',
    )
    recipient_stranger_name = models.CharField(max_length=150, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    event_type = models.CharField(max_length=50, blank=True)
    strategy = models.CharField(max_length=50, blank=True)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    items = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        recipient_name = self.recipient.username if self.recipient else self.recipient_stranger_name
        return f"GiftHistory by {self.giver.username} -> {recipient_name}"
