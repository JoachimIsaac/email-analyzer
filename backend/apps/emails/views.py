import logging
import threading
from collections import defaultdict

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile
from services.gmail_service import fetch_messages
from services.openai_service import classify_batch

from .models import Classification, Email, SyncJob

logger = logging.getLogger(__name__)

VALID_BATCH_SIZES = {10, 25, 50, 100, 200, 300, 500}


# ── Background sync thread ─────────────────────────────────────────────────────

def _run_sync(job_id: int) -> None:
    """
    Runs in a background thread.  Fetches emails from Gmail, classifies them
    with OpenAI, and writes results to the database.  Updates SyncJob progress
    fields as work progresses so the polling endpoint can report live status.
    """
    from django.db import close_old_connections, connection  # noqa: PLC0415

    close_old_connections()

    try:
        job = SyncJob.objects.select_related("user__profile").get(pk=job_id)
        profile: UserProfile = job.user.profile

        SyncJob.objects.filter(pk=job_id).update(status=SyncJob.STATUS_RUNNING)

        # ── Fetch from Gmail ───────────────────────────────────────────────────
        parsed, new_history_id = fetch_messages(profile, batch_size=job.batch_size)
        SyncJob.objects.filter(pk=job_id).update(emails_fetched=len(parsed))

        # ── Skip already-stored message IDs (dedup) ───────────────────────────
        existing_ids = set(
            Email.objects.filter(
                user=job.user,
                gmail_message_id__in=[e["gmail_message_id"] for e in parsed],
            ).values_list("gmail_message_id", flat=True)
        )
        new_emails = [e for e in parsed if e["gmail_message_id"] not in existing_ids]

        if new_emails:
            # ── Two-pass classification ────────────────────────────────────────
            classified_count = 0
            skipped_count = 0

            def on_progress(result: dict) -> None:
                nonlocal classified_count, skipped_count
                if result["relevant"]:
                    classified_count += 1
                else:
                    skipped_count += 1
                SyncJob.objects.filter(pk=job_id).update(
                    emails_classified=classified_count,
                    emails_skipped=skipped_count,
                )

            results = classify_batch(new_emails, on_progress=on_progress)
            result_map = {r["gmail_message_id"]: r for r in results}

            # ── Persist emails + classifications ──────────────────────────────
            new_count = 0
            for email_data in new_emails:
                result = result_map.get(email_data["gmail_message_id"])
                if result is None:
                    continue

                email_obj, created = Email.objects.get_or_create(
                    user=job.user,
                    gmail_message_id=email_data["gmail_message_id"],
                    defaults={
                        "sender": email_data["sender"],
                        "subject": email_data["subject"],
                        "body_snippet": email_data["body_snippet"],
                        "body": email_data["body"],
                        "received_at": email_data["received_at"],
                    },
                )

                if result["label"]:
                    try:
                        Classification.objects.update_or_create(
                            email=email_obj,
                            defaults={
                                "label": result["label"],
                                "confidence_score": result["confidence"],
                                "raw_openai_response": {"raw": result["raw"]},
                            },
                        )
                        if created:
                            new_count += 1
                    except Exception as exc:
                        logger.error(f"Failed to save classification for email {email_obj.pk}: {exc}")

            SyncJob.objects.filter(pk=job_id).update(new_classifications=new_count)

        # ── Advance the history bookmark for incremental next sync ────────────
        if new_history_id:
            UserProfile.objects.filter(pk=profile.pk).update(
                gmail_history_id=new_history_id,
                last_sync_at=timezone.now(),
            )

        SyncJob.objects.filter(pk=job_id).update(status=SyncJob.STATUS_COMPLETE)

    except Exception as exc:
        logger.exception(f"Sync job {job_id} failed")
        SyncJob.objects.filter(pk=job_id).update(
            status=SyncJob.STATUS_FAILED,
            error_message=str(exc)[:2000],
        )

    finally:
        connection.close()


# ── DRF Views ──────────────────────────────────────────────────────────────────

class SyncView(APIView):
    """POST /api/sync — start a background sync job."""

    def post(self, request: Request) -> Response:
        # Prevent double-sync
        if SyncJob.objects.filter(
            user=request.user,
            status__in=[SyncJob.STATUS_PENDING, SyncJob.STATUS_RUNNING],
        ).exists():
            return Response(
                {"error": "A sync is already in progress."},
                status=status.HTTP_409_CONFLICT,
            )

        # Clamp batch_size to the nearest valid option
        try:
            batch_size = int(request.data.get("batch_size", 50))
        except (TypeError, ValueError):
            batch_size = 50
        if batch_size not in VALID_BATCH_SIZES:
            batch_size = min(VALID_BATCH_SIZES, key=lambda x: abs(x - batch_size))

        job = SyncJob.objects.create(user=request.user, batch_size=batch_size)

        thread = threading.Thread(target=_run_sync, args=(job.pk,), daemon=True)
        thread.start()

        return Response(
            {"job_id": job.pk, "status": job.status, "batch_size": job.batch_size},
            status=status.HTTP_202_ACCEPTED,
        )


class SyncStatusView(APIView):
    """GET /api/sync/status/<job_id> — poll a sync job for live progress."""

    def get(self, request: Request, job_id: int) -> Response:
        try:
            job = SyncJob.objects.get(pk=job_id, user=request.user)
        except SyncJob.DoesNotExist:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "job_id": job.pk,
            "status": job.status,
            "batch_size": job.batch_size,
            "emails_fetched": job.emails_fetched,
            "emails_classified": job.emails_classified,
            "emails_skipped": job.emails_skipped,
            "new_classifications": job.new_classifications,
            "error_message": job.error_message or None,
            "created_at": job.created_at.isoformat(),
            "updated_at": job.updated_at.isoformat(),
        })


class _EmailPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class EmailListView(APIView):
    """GET /api/emails — paginated list of classified emails for the current user."""

    def get(self, request: Request) -> Response:
        label = request.query_params.get("label")

        qs = (
            Email.objects.filter(user=request.user)
            .select_related("classification")
            .order_by("-received_at")
        )
        if label:
            qs = qs.filter(classification__label=label)

        paginator = _EmailPagination()
        page = paginator.paginate_queryset(qs, request)

        data = []
        for email in page:
            clf = getattr(email, "classification", None)
            data.append({
                "id": email.pk,
                "gmail_message_id": email.gmail_message_id,
                "sender": email.sender,
                "subject": email.subject,
                "body_snippet": email.body_snippet,
                "received_at": email.received_at.isoformat(),
                "label": clf.label if clf else None,
                "confidence": clf.confidence_score if clf else None,
            })

        return paginator.get_paginated_response(data)


class FunnelView(APIView):
    """GET /api/dashboard/funnel — email counts per classification label."""

    def get(self, request: Request) -> Response:
        counts = (
            Classification.objects.filter(email__user=request.user)
            .values("label")
            .annotate(count=Count("id"))
        )

        # Build a complete dict with all 6 labels (zero-fill missing ones)
        label_map = {row["label"]: row["count"] for row in counts}
        funnel = [
            {"label": label, "display": display, "count": label_map.get(label, 0)}
            for label, display in Classification.LABEL_CHOICES
        ]

        return Response({
            "total": sum(row["count"] for row in funnel),
            "funnel": funnel,
        })


class SyncHistoryView(APIView):
    """GET /api/sync/history — completed sync jobs for the per-run bar chart."""

    def get(self, request: Request) -> Response:
        jobs = (
            SyncJob.objects.filter(user=request.user, status=SyncJob.STATUS_COMPLETE)
            .order_by("-created_at")[:60]
        )
        total_runs = SyncJob.objects.filter(
            user=request.user, status=SyncJob.STATUS_COMPLETE
        ).count()

        return Response({
            "total_runs": total_runs,
            "runs": [
                {
                    "job_id": j.pk,
                    "batch_size": j.batch_size,
                    "emails_classified": j.emails_classified,
                    "new_classifications": j.new_classifications,
                    "created_at": j.created_at.isoformat(),
                }
                for j in jobs
            ],
        })


class TrendsView(APIView):
    """GET /api/dashboard/trends — daily classification counts for the trend chart."""

    def get(self, request: Request) -> Response:
        label_keys = [label for label, _ in Classification.LABEL_CHOICES]

        rows = (
            Classification.objects.filter(email__user=request.user)
            .annotate(date=TruncDate("email__received_at"))
            .values("date", "label")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        by_date: dict = defaultdict(lambda: {k: 0 for k in label_keys})
        for row in rows:
            by_date[row["date"].isoformat()][row["label"]] = row["count"]

        return Response({
            "trends": [
                {"date": date, **counts}
                for date, counts in sorted(by_date.items())
            ]
        })
