from django.db import models

from apps.users.models import User
from apps.products.models import Product


class WishlistItem(models.Model):
    class PrivacyLevel(models.TextChoices):
        PUBLIC = 'public', 'Public'
        PRIVATE = 'private', 'Private'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    privacy = models.CharField(
        max_length=10, choices=PrivacyLevel.choices, default=PrivacyLevel.PUBLIC
    )
    priority = models.IntegerField(default=0)  # 0 = no priority, 5 = most wanted
    note = models.TextField(blank=True, max_length=200)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-priority', '-added_at']

    def __str__(self):
        return f"{self.user.username} → {self.product.name}"
