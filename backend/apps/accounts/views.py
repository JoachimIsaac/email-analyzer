import logging
import traceback

from django.conf import settings
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect, HttpResponseServerError
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile

logger = logging.getLogger(__name__)


def _build_flow(code_verifier: str | None = None) -> Flow:
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=settings.GOOGLE_SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
        code_verifier=code_verifier,
    )


class GoogleLoginView(APIView):
    permission_classes = []  # public endpoint

    def get(self, request: Request) -> HttpResponseRedirect:
        flow = _build_flow()
        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",  # force consent so we always get a refresh token
        )
        request.session["oauth_state"] = state
        # Persist so the callback can complete the PKCE exchange
        request.session["oauth_code_verifier"] = flow.code_verifier
        return HttpResponseRedirect(auth_url)


class GoogleCallbackView(APIView):
    permission_classes = []  # public endpoint

    def get(self, request: Request) -> HttpResponseRedirect:
        error = request.query_params.get("error")
        if error:
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error={error}")

        code = request.query_params.get("code")
        if not code:
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=missing_code")

        try:
            # Rebuild flow with the same code_verifier used at login
            code_verifier = request.session.get("oauth_code_verifier")
            flow = _build_flow(code_verifier=code_verifier)
            flow.fetch_token(code=code)
            credentials: Credentials = flow.credentials

            # Fetch the user's Google profile
            oauth2_service = build("oauth2", "v2", credentials=credentials)
            user_info = oauth2_service.userinfo().get().execute()

            email: str = user_info["email"]
            first_name: str = user_info.get("given_name", "")
            last_name: str = user_info.get("family_name", "")

            # Create or retrieve the Django user
            user, created = User.objects.get_or_create(
                username=email,
                defaults={"email": email, "first_name": first_name, "last_name": last_name},
            )
            if not created:
                user.first_name = first_name
                user.last_name = last_name
                user.save(update_fields=["first_name", "last_name"])

            # Store encrypted tokens on the profile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.google_access_token = credentials.token
            # Google only returns a refresh token on first consent; keep the old one if absent
            if credentials.refresh_token:
                profile.google_refresh_token = credentials.refresh_token
            profile.token_expiry = credentials.expiry
            profile.save()

            # Issue JWT pair
            refresh = RefreshToken.for_user(user)
            redirect_url = (
                f"{settings.FRONTEND_URL}/auth/callback"
                f"?access={str(refresh.access_token)}&refresh={str(refresh)}"
            )
            return HttpResponseRedirect(redirect_url)

        except Exception:
            logger.exception("Google OAuth callback failed")
            if settings.DEBUG:
                return HttpResponseServerError(
                    traceback.format_exc(), content_type="text/plain"
                )
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=oauth_failed")


class MeView(APIView):
    """Returns the current authenticated user's profile."""

    def get(self, request: Request) -> Response:
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        })
