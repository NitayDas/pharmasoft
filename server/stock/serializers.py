from rest_framework import serializers

from .models import Product, PurchaseImportBatch, PurchaseImportRow, Stock


class ProductSerializer(serializers.ModelSerializer):
    stock_quantity = serializers.IntegerField(write_only=True, required=False, min_value=0)
    current_stock = serializers.IntegerField(source="stock.quantity", read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "sku", "batch", "unit", "unit_price", "stock_quantity", "current_stock", "is_active"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["stock_quantity"] = data.pop("current_stock", 0)
        return data

    def create(self, validated_data):
        stock_quantity = validated_data.pop("stock_quantity", 0)
        product = Product.objects.create(**validated_data)
        Stock.objects.create(product=product, quantity=stock_quantity)
        return product

    def update(self, instance, validated_data):
        stock_quantity = validated_data.pop("stock_quantity", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if stock_quantity is not None:
            stock, _ = Stock.objects.get_or_create(product=instance)
            stock.quantity = stock_quantity
            stock.save(update_fields=["quantity", "updated_at"])

        return instance


class PurchaseImportRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseImportRow
        fields = [
            "id",
            "row_number",
            "action",
            "product",
            "product_name",
            "sku",
            "quantity_added",
            "stock_before",
            "stock_after",
            "message",
        ]


class PurchaseImportBatchSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)
    results = PurchaseImportRowSerializer(source="rows", many=True, read_only=True)
    summary = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseImportBatch
        fields = [
            "id",
            "file_name",
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
