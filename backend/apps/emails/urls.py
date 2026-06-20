from django.urls import path

from .views import (
    EmailListView,
    FunnelView,
    SyncHistoryView,
    SyncStatusView,
    SyncView,
    TrendsView,
)

urlpatterns = [
    path("sync", SyncView.as_view(), name="sync"),
    path("sync/status/<int:job_id>", SyncStatusView.as_view(), name="sync-status"),
    path("sync/history", SyncHistoryView.as_view(), name="sync-history"),
    path("emails", EmailListView.as_view(), name="email-list"),
    path("dashboard/funnel", FunnelView.as_view(), name="dashboard-funnel"),
    path("dashboard/trends", TrendsView.as_view(), name="dashboard-trends"),
]
