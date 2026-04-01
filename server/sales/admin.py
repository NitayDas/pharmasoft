from django.contrib import admin

from .models import Product, Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ('item_name', 'batch', 'unit', 'qty', 'unit_price', 'discount_percent', 'gross_amount', 'discount_amount', 'net_amount')
    can_delete = False


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'batch', 'unit_price', 'stock_quantity', 'is_active')
    list_filter = ('is_active', 'unit')
    search_fields = ('name', 'sku', 'batch')


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('sale_no', 'customer_name', 'sale_date', 'served_by', 'payment_method', 'grand_total', 'due_amount')
    list_filter = ('payment_method', 'sale_date')
    search_fields = ('sale_no', 'customer_name')
    inlines = [SaleItemInline]
    readonly_fields = ('sale_no', 'subtotal', 'discount_amount', 'vat_amount', 'grand_total', 'paid_amount', 'due_amount', 'created_at')

