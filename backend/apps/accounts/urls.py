from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import GoogleCallbackView, GoogleLoginView, MeView

urlpatterns = [
    path("auth/google/login", GoogleLoginView.as_view(), name="google_login"),
    path("auth/google/callback", GoogleCallbackView.as_view(), name="google_callback"),
    path("auth/token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me", MeView.as_view(), name="me"),
]
