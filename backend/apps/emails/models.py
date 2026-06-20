from django.contrib.auth.models import User
from django.db import models


class Email(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="emails")
    gmail_message_id = models.CharField(max_length=255)
    # CharField, not EmailField — Gmail "From" headers include display names
    sender = models.CharField(max_length=512, blank=True)
    subject = models.TextField(blank=True)
    body_snippet = models.TextField(blank=True)
    body = models.TextField(blank=True)
    received_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "gmail_message_id")]
        ordering = ["-received_at"]

    def __str__(self) -> str:
        return f"{self.subject[:60]} ({self.sender})"


class Classification(models.Model):
    LABEL_CHOICES = [
        ("auto_acknowledgement", "Auto Acknowledgement"),
        ("rejection", "Rejection"),
        ("interview_invite", "Interview Invite"),
        ("follow_up_required", "Follow Up Required"),
        ("recruiter_outreach", "Recruiter Outreach"),
        ("offer", "Offer"),
    ]

    email = models.OneToOneField(Email, on_delete=models.CASCADE, related_name="classification")
    label = models.CharField(max_length=50, choices=LABEL_CHOICES)
    confidence_score = models.FloatField()
    raw_openai_response = models.JSONField()
    classified_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.label} ({self.confidence_score:.0%}) — {self.email.subject[:40]}"


class SyncJob(models.Model):
    STATUS_PENDING = "pending"
    STATUS_RUNNING = "running"
    STATUS_COMPLETE = "complete"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETE, "Complete"),
        (STATUS_FAILED, "Failed"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sync_jobs")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    batch_size = models.IntegerField(default=50)
    emails_fetched = models.IntegerField(default=0)
    emails_classified = models.IntegerField(default=0)
    emails_skipped = models.IntegerField(default=0)
    new_classifications = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"SyncJob({self.user.email}, {self.status}, batch={self.batch_size})"
