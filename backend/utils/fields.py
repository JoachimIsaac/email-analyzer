import base64
import os

from cryptography.fernet import Fernet
from django.conf import settings
from django.db import models


def _get_fernet() -> Fernet:
    key = getattr(settings, "FIELD_ENCRYPTION_KEY", None)
    if not key:
        # Derive a stable 32-byte key from SECRET_KEY as a fallback
        raw = settings.SECRET_KEY.encode()[:32].ljust(32, b"0")
        key = base64.urlsafe_b64encode(raw)
    return Fernet(key)


class EncryptedTextField(models.TextField):
    """Transparently encrypts/decrypts text values using Fernet (AES-128-CBC)."""

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
        return _get_fernet().decrypt(value.encode()).decode()

    def to_python(self, value):
        return value

    def get_prep_value(self, value):
        if value is None or value == "":
            return value
        return _get_fernet().encrypt(value.encode()).decode()
