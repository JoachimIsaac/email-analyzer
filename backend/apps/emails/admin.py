from django.contrib import admin

from .models import Classification, Email


class ClassificationInline(admin.StackedInline):
    model = Classification
    readonly_fields = ("classified_at",)
    extra = 0


@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    list_display = ("subject", "sender", "user", "received_at", "classification_label")
    list_filter = ("classification__label",)
    search_fields = ("subject", "sender", "user__email")
    readonly_fields = ("created_at",)
    inlines = [ClassificationInline]

    @admin.display(description="Label")
    def classification_label(self, obj: Email) -> str:
        try:
            return obj.classification.label
        except Classification.DoesNotExist:
            return "—"


@admin.register(Classification)
class ClassificationAdmin(admin.ModelAdmin):
    list_display = ("email", "label", "confidence_score", "classified_at")
    list_filter = ("label",)
    search_fields = ("email__subject", "email__sender")
    readonly_fields = ("classified_at",)
