from django.contrib import admin

from .models import PurchaseEntry, PurchaseEntryItem


class PurchaseEntryItemInline(admin.TabularInline):
    model = PurchaseEntryItem
    extra = 0
    readonly_fields = (
        "row_number",
        "action",
        "product",
        "product_name",
        "sku",
        "batch",
        "unit",
        "unit_price",
        "quantity_added",
        "stock_before",
        "stock_after",
        "message",
    )


@admin.register(PurchaseEntry)
class PurchaseEntryAdmin(admin.ModelAdmin):
    list_display = (
        "entry_no",
        "source",
        "file_name",
        "created_by",
        "total_rows",
        "total_quantity_added",
        "created_at",
    )
    list_filter = ("source", "created_at")
    search_fields = ("entry_no", "file_name", "notes")
    inlines = [PurchaseEntryItemInline]

