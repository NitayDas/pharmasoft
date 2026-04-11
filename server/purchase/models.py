from django.conf import settings
from django.db import models


class PurchaseEntry(models.Model):
    SOURCE_CHOICES = [
        ("excel", "Purchase Entry by Excel"),
        ("manual", "Purchase"),
    ]

    entry_no = models.CharField(max_length=32, unique=True, blank=True)
    source = models.CharField(max_length=16, choices=SOURCE_CHOICES)
    file_name = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_entries",
    )
    total_rows = models.PositiveIntegerField(default=0)
    processed_rows = models.PositiveIntegerField(default=0)
    created_products = models.PositiveIntegerField(default=0)
    updated_products = models.PositiveIntegerField(default=0)
    failed_rows = models.PositiveIntegerField(default=0)
    total_quantity_added = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.entry_no or f"Purchase {self.pk}"

    def generate_entry_no(self):
        last_entry = PurchaseEntry.objects.order_by("-id").first()
        next_number = 1 if not last_entry else last_entry.id + 1
        return f"PU-{next_number:06d}"

    def save(self, *args, **kwargs):
        if not self.entry_no:
            self.entry_no = self.generate_entry_no()
        super().save(*args, **kwargs)


class PurchaseEntryItem(models.Model):
    ACTION_CHOICES = [
        ("created", "Created"),
        ("updated", "Updated"),
        ("failed", "Failed"),
    ]

    purchase_entry = models.ForeignKey(
        PurchaseEntry,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "sales.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_items",
    )
    row_number = models.PositiveIntegerField(default=1)
    action = models.CharField(max_length=16, choices=ACTION_CHOICES)
    product_name = models.CharField(max_length=255, blank=True)
    sku = models.CharField(max_length=64, blank=True)
    batch = models.CharField(max_length=64, blank=True)
    unit = models.CharField(max_length=32, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_added = models.PositiveIntegerField(default=0)
    stock_before = models.PositiveIntegerField(null=True, blank=True)
    stock_after = models.PositiveIntegerField(null=True, blank=True)
    message = models.TextField(blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.purchase_entry.entry_no} · {self.product_name or self.sku}"

