from django.db import connection
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Public health check — verifies API and database connectivity."""

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request: Request) -> Response:
        db_status = "ok"
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            db_status = "error"

        overall_status = "ok" if db_status == "ok" else "degraded"
        http_status = status.HTTP_200_OK if db_status == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(
            {
                "status": overall_status,
                "database": db_status,
            },
            status=http_status,
        )
