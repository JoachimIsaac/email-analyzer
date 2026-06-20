from django.contrib.auth.models import User
from django.db import models

from utils.fields import EncryptedTextField


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    google_access_token = EncryptedTextField(blank=True)
    google_refresh_token = EncryptedTextField(blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Profile({self.user.email})"
