from django.contrib.auth.models import User
from django.db import models


class Company(models.Model):
    STATUS_CHOICES = [
        ("applied", "Applied"),
        ("interviewing", "Interviewing"),
        ("offer", "Offer"),
        ("rejected", "Rejected"),
        ("closed", "Closed"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="companies")
    company_name = models.CharField(max_length=255)
    role_title = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="applied")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_updated"]

    def __str__(self) -> str:
        return f"{self.company_name} — {self.role_title} ({self.status})"
