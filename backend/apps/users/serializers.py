import re

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User
from .services import AuthService


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(min_length=3, max_length=30)
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError(
                "Username may only contain letters, digits, and underscores."
            )
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate(self, data):
        password = data.get('password', '')
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        if not any(c.isalpha() for c in password):
            raise serializers.ValidationError({"password": "Password must contain at least one letter."})
        if not any(c.isdigit() for c in password):
            raise serializers.ValidationError({"password": "Password must contain at least one digit."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        return AuthService.register(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
        )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # User.USERNAME_FIELD = 'email', so simplejwt already accepts email + password.
    # We only need to add the user object to the response.
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'gravatar_hash': self.user.gravatar_hash,
        }
        return data


class UserSettingsUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email']
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False},
        }


class ProfileUpdateSerializer(serializers.Serializer):
    bio = serializers.CharField(required=False, allow_blank=True, max_length=500)
    interest_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )
    preferred_category_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )
    excluded_category_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
