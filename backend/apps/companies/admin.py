from django.contrib import admin

from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("company_name", "role_title", "status", "user", "last_updated")
    list_filter = ("status",)
    search_fields = ("company_name", "role_title", "user__email")
