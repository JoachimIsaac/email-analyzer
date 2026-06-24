"""Django settings for EmailAnalyzer."""

import os
import sys
from datetime import timedelta
from pathlib import Path

import truststore
from dotenv import load_dotenv

# Patch Python's SSL to use the OS certificate store (fixes SSL on Windows)
truststore.inject_into_ssl()

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure-change-me")
FIELD_ENCRYPTION_KEY = os.environ.get("FIELD_ENCRYPTION_KEY", None)
DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "apps.accounts",
    "apps.emails",
    "apps.companies",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DB_NAME = os.environ.get("PGDATABASE") or os.environ.get("POSTGRES_DB")
DB_USER = os.environ.get("PGUSER") or os.environ.get("POSTGRES_USER")
DB_PASSWORD = os.environ.get("PGPASSWORD") or os.environ.get("POSTGRES_PASSWORD")
DB_HOST = os.environ.get("PGHOST") or os.environ.get("POSTGRES_HOST")
DB_PORT = os.environ.get("PGPORT") or os.environ.get("POSTGRES_PORT") or "5432"

if not all([DB_NAME, DB_USER, DB_PASSWORD, DB_HOST]):
    raise RuntimeError("Missing required database environment variables: PGDATABASE/POSTGRES_DB, PGUSER/POSTGRES_USER, PGPASSWORD/POSTGRES_PASSWORD, PGHOST/POSTGRES_HOST")

db_config = {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": DB_NAME,
    "USER": DB_USER,
    "PASSWORD": DB_PASSWORD,
    "HOST": DB_HOST,
    "PORT": DB_PORT,
    "OPTIONS": {"sslmode": "require"},
}

DATABASES = {"default": db_config}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Django REST Framework ──────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# ── JWT ────────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}

# ── Google OAuth ───────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.environ.get(
    "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback"
)
GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
]

# Frontend URL — where to redirect after successful OAuth
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "apps": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}

# ── CORS ───────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
