from django.conf import settings
from django.db import models
from datetime import date


def _next_employee_id():
    last = Staff.objects.order_by('id').last()
    next_num = (last.id + 1) if last else 1
    return f"EMP{next_num:04d}"


class Staff(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('sales_representative', 'Sales Representative'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='staff_profile',
    )
    employee_id = models.CharField(max_length=20, unique=True, editable=False)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    joining_date = models.DateField(default=date.today)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_staff',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Staff'
        verbose_name_plural = 'Staff'

    def save(self, *args, **kwargs):
        if not self.employee_id:
            self.employee_id = _next_employee_id()
        super().save(*args, **kwargs)

    def __str__(self):
        name = self.user.get_full_name() or self.user.username
        return f"{name} [{self.employee_id}] ({self.get_role_display()})"
