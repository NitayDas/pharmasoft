from django.contrib import admin

from .models import Staff


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'get_full_name', 'role', 'phone', 'joining_date', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'joining_date']
    search_fields = ['employee_id', 'user__username', 'user__first_name', 'user__last_name', 'user__email']
    readonly_fields = ['employee_id', 'created_at', 'updated_at']
    raw_id_fields = ['user', 'created_by']
    ordering = ['-created_at']

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_full_name.short_description = 'Name'
