from decimal import Decimal
from datetime import date

from django.conf import settings
from django.db import models


class Product(models.Model):
    # Core identification
    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True)
    sku = models.CharField(max_length=64, unique=True)
    barcode = models.CharField(max_length=100, blank=True, db_index=True)

    # Classification
    category = models.CharField(max_length=100, blank=True)
    manufacturer = models.CharField(max_length=255, blank=True)

    # Packaging / shelf info
    unit = models.CharField(max_length=32, default='Box')
    batch = models.CharField(max_length=64, blank=True)
    expiry_date = models.DateField(null=True, blank=True)

    # Pricing
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # MRP / selling price

    # Stock management
    reorder_level = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def is_expired(self):
        return bool(self.expiry_date and self.expiry_date < date.today())

    @property
    def is_expiring_soon(self):
        if not self.expiry_date:
            return False
        from datetime import timedelta
        return self.expiry_date <= date.today() + timedelta(days=30)


class Stock(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='stock')
    quantity = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['product__name']

    def __str__(self):
        return f'{self.product.name} stock ({self.quantity})'

    @property
    def is_low(self):
        return self.quantity <= self.product.reorder_level

    @property
    def is_out_of_stock(self):
        return self.quantity == 0


class StockMovement(models.Model):
    MOVEMENT_CHOICES = [
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('adjustment', 'Adjustment'),
        ('return', 'Return'),
        ('expired', 'Expired/Damaged'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_CHOICES)
    quantity = models.IntegerField()
    quantity_before = models.PositiveIntegerField()
    quantity_after = models.PositiveIntegerField()
    reference = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='stock_movements',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_movement_type_display()} – {self.product.name} ({self.quantity:+d})'


class PurchaseImportBatch(models.Model):
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='purchase_import_batches',
    )
    file_name = models.CharField(max_length=255)
    total_rows = models.PositiveIntegerField(default=0)
    processed_rows = models.PositiveIntegerField(default=0)
    created_products = models.PositiveIntegerField(default=0)
    updated_products = models.PositiveIntegerField(default=0)
    failed_rows = models.PositiveIntegerField(default=0)
    total_quantity_added = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Purchase import #{self.pk} - {self.file_name}'


class PurchaseImportRow(models.Model):
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('failed', 'Failed'),
    ]

    batch = models.ForeignKey(PurchaseImportBatch, on_delete=models.CASCADE, related_name='rows')
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='purchase_import_rows',
    )
    row_number = models.PositiveIntegerField()
    action = models.CharField(max_length=16, choices=ACTION_CHOICES)
    product_name = models.CharField(max_length=255, blank=True)
    sku = models.CharField(max_length=64, blank=True)
    quantity_added = models.PositiveIntegerField(default=0)
    stock_before = models.PositiveIntegerField(null=True, blank=True)
    stock_after = models.PositiveIntegerField(null=True, blank=True)
    message = models.TextField(blank=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'Import row {self.row_number} ({self.action})'


class Customer(models.Model):
    """Customer database for tracking purchase history and due amounts."""
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, unique=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    total_purchase_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_due_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    medicine_history = models.TextField(blank=True, help_text='Medicine history and notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.phone})'

    def recalculate_totals(self):
        """Recompute totals from Sale records. Call within a transaction."""
        from django.db.models import Sum, Value
        from django.db.models.functions import Coalesce
        from django.db.models import DecimalField
        agg = self.sales.aggregate(
            total_purchase=Coalesce(Sum('grand_total'), Value(Decimal('0.00')), output_field=DecimalField()),
            total_due=Coalesce(Sum('due_amount'), Value(Decimal('0.00')), output_field=DecimalField()),
        )
        self.total_purchase_amount = agg['total_purchase']
        self.total_due_amount = agg['total_due']
        self.save(update_fields=['total_purchase_amount', 'total_due_amount'])


class Sale(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('mobile_banking', 'Mobile Banking'),
    ]

    sale_no = models.CharField(max_length=32, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    customer_name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=32, blank=True)
    sale_date = models.DateField()
    served_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='sales')
    payment_method = models.CharField(max_length=32, choices=PAYMENT_METHOD_CHOICES, default='cash')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    vat_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    due_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.sale_no

    @property
    def payment_status(self):
        if self.due_amount <= 0:
            return 'paid'
        if self.paid_amount > 0:
            return 'partial'
        return 'unpaid'


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='sale_items')
    item_name = models.CharField(max_length=255)
    batch = models.CharField(max_length=64, blank=True)
    unit = models.CharField(max_length=32, default='Box')
    qty = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.item_name} ({self.sale.sale_no})'


class PaymentTransaction(models.Model):
    """Immutable payment record for an invoice — one per payment event."""
    PAYMENT_METHOD_CHOICES = Sale.PAYMENT_METHOD_CHOICES + [
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
    ]

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    payment_date = models.DateField(default=date.today)
    reference_number = models.CharField(max_length=100, blank=True)
    mobile_provider = models.CharField(max_length=50, blank=True)
    note = models.TextField(blank=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='received_payments',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment ৳{self.amount} on {self.sale.sale_no}'
