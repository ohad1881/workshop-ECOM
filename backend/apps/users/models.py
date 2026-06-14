from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with additional fields."""
    
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    # Privacy settings
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]
    interests_privacy = models.CharField(max_length=10, choices=PRIVACY_CHOICES, default='public')
    preferences_privacy = models.CharField(max_length=10, choices=PRIVACY_CHOICES, default='public')
    wishlist_privacy = models.CharField(max_length=10, choices=PRIVACY_CHOICES, default='public')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username
