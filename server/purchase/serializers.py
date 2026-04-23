from decimal import Decimal

from rest_framework import serializers

from sales.models import Product, Stock

from .models import PurchaseEntry, PurchaseEntryItem


class PurchaseEntryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseEntryItem
        fields = [
            "id",
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
        ]


class PurchaseEntrySerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    uploaded_by = serializers.PrimaryKeyRelatedField(source="created_by", read_only=True)
    uploaded_by_username = serializers.CharField(source="created_by.username", read_only=True)
    results = PurchaseEntryItemSerializer(source="items", many=True, read_only=True)
    summary = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseEntry
        fields = [
            "id",
            "entry_no",
            "source",
            "file_name",
            "notes",
            "created_by",
            "created_by_username",
            "uploaded_by",
            "uploaded_by_username",
            "total_rows",
            "processed_rows",
            "created_products",
            "updated_products",
            "failed_rows",
            "total_quantity_added",
            "created_at",
            "summary",
            "results",
        ]

    def get_summary(self, obj):
        return {
            "total_rows": obj.total_rows,
            "processed_rows": obj.processed_rows,
            "created_products": obj.created_products,
            "updated_products": obj.updated_products,
            "failed_rows": obj.failed_rows,
            "total_quantity_added": obj.total_quantity_added,
        }


class ManualPurchaseCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    sku = serializers.CharField(max_length=64)
    batch = serializers.CharField(max_length=64, required=False, allow_blank=True)
    unit = serializers.CharField(max_length=32, required=False, allow_blank=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal("0.00"))
    purchase_quantity = serializers.IntegerField(min_value=1)
    is_active = serializers.BooleanField(required=False, default=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_sku(self, value):
        return value.strip()

