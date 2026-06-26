from django.contrib.auth.models import AbstractUser
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)  # Emoji or MUI icon name

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True, max_length=500)
    avatar = models.ImageField(
        upload_to='avatars/',
        default='avatars/default_avatar.png'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username


class UserProfile(models.Model):
    class PrivacyLevel(models.TextChoices):
        PUBLIC = 'public', 'Public'
        PRIVATE = 'private', 'Private'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    interests = models.ManyToManyField(Category, blank=True, related_name='interested_users')
    preferred_categories = models.ManyToManyField(Category, blank=True, related_name='preferred_by')
    excluded_categories = models.ManyToManyField(Category, blank=True, related_name='excluded_by')

    interests_privacy = models.CharField(
        max_length=10, choices=PrivacyLevel.choices, default=PrivacyLevel.PUBLIC
    )
    preferences_privacy = models.CharField(
        max_length=10, choices=PrivacyLevel.choices, default=PrivacyLevel.PUBLIC
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"
