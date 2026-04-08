from django.contrib import admin

from .models import Customer, Product, Sale, SaleItem, Stock


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ('item_name', 'batch', 'unit', 'qty', 'unit_price', 'discount_percent', 'gross_amount', 'discount_amount', 'net_amount')
    can_delete = False


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'batch', 'unit_price', 'stock_quantity_display', 'is_active')
    list_filter = ('is_active', 'unit')
    search_fields = ('name', 'sku', 'batch')

    @admin.display(description='Stock Quantity')
    def stock_quantity_display(self, obj):
        return obj.stock.quantity if hasattr(obj, 'stock') else 0


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'updated_at')
    search_fields = ('product__name', 'product__sku')


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('sale_no', 'customer_name', 'sale_date', 'served_by', 'payment_method', 'grand_total', 'due_amount')
    list_filter = ('payment_method', 'sale_date')
    search_fields = ('sale_no', 'customer_name')
    inlines = [SaleItemInline]
    readonly_fields = ('sale_no', 'subtotal', 'discount_amount', 'vat_amount', 'grand_total', 'paid_amount', 'due_amount', 'created_at')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'total_purchase_amount', 'total_due_amount', 'updated_at')
    search_fields = ('name', 'phone', 'email')
