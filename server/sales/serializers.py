from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import Product, Sale, SaleItem

User = get_user_model()


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'batch', 'unit', 'unit_price', 'stock_quantity', 'is_active']


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'sku', 'item_name', 'batch', 'unit',
            'qty', 'unit_price', 'discount_percent', 'gross_amount', 'discount_amount', 'net_amount',
        ]
        read_only_fields = ['gross_amount', 'discount_amount', 'net_amount']


class SaleItemCreateSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))
    item_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    batch = serializers.CharField(max_length=64, required=False, allow_blank=True)
    unit = serializers.CharField(max_length=32, required=False, allow_blank=True)
    qty = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100)


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    served_by_username = serializers.CharField(source='served_by.username', read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'sale_no', 'customer_name', 'contact_number', 'sale_date', 'served_by',
            'served_by_username', 'payment_method', 'subtotal', 'discount_amount', 'vat_amount',
            'grand_total', 'paid_amount', 'due_amount', 'notes', 'items', 'created_at',
        ]
        read_only_fields = ['subtotal', 'discount_amount', 'vat_amount', 'grand_total', 'paid_amount', 'due_amount', 'created_at']

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        subtotal = Decimal('0')
        discount_amount = Decimal('0')

        sale = Sale.objects.create(
            sale_no=self._generate_sale_no(),
            subtotal=Decimal('0'),
            discount_amount=Decimal('0'),
            vat_amount=Decimal('0'),
            grand_total=Decimal('0'),
            paid_amount=Decimal('0'),
            due_amount=Decimal('0'),
            **validated_data,
        )

        for item_data in items_data:
            product = item_data['product']
            qty = Decimal(item_data['qty'])
            unit_price = Decimal(item_data['unit_price'])
            discount_percent = Decimal(item_data.get('discount_percent', 0))

            if product.stock_quantity < int(qty):
                raise serializers.ValidationError({
                    'items': [f'Insufficient stock for {product.name}. Available: {product.stock_quantity}.']
                })

            gross_amount = qty * unit_price
            line_discount_amount = (gross_amount * discount_percent) / Decimal('100')
            net_amount = gross_amount - line_discount_amount

            SaleItem.objects.create(
                sale=sale,
                product=product,
                item_name=item_data.get('item_name') or product.name,
                batch=item_data.get('batch') or product.batch,
                unit=item_data.get('unit') or product.unit,
                qty=qty,
                unit_price=unit_price,
                discount_percent=discount_percent,
                gross_amount=gross_amount,
                discount_amount=line_discount_amount,
                net_amount=net_amount,
            )

            subtotal += gross_amount
            discount_amount += line_discount_amount

            product.stock_quantity -= int(qty)
            product.save(update_fields=['stock_quantity', 'updated_at'])

        vat_amount = (subtotal * Decimal('0.03')).quantize(Decimal('0.01'))
        grand_total = subtotal - discount_amount + vat_amount
        paid_amount = grand_total
        due_amount = Decimal('0')

        sale.subtotal = subtotal
        sale.discount_amount = discount_amount
        sale.vat_amount = vat_amount
        sale.grand_total = grand_total
        sale.paid_amount = paid_amount
        sale.due_amount = due_amount
        sale.save(update_fields=['subtotal', 'discount_amount', 'vat_amount', 'grand_total', 'paid_amount', 'due_amount'])
        return sale

    def _generate_sale_no(self):
        last_sale = Sale.objects.order_by('-id').first()
        next_number = 1 if not last_sale else last_sale.id + 1
        return f'SL-{next_number:06d}'


class SaleCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=255)
    contact_number = serializers.CharField(max_length=32, required=False, allow_blank=True)
    sale_date = serializers.DateField()
    served_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    payment_method = serializers.ChoiceField(choices=Sale.PAYMENT_METHOD_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = SaleItemCreateSerializer(many=True)

    def create(self, validated_data):
        sale_serializer = SaleSerializer()
        return sale_serializer.create({
            'customer_name': validated_data['customer_name'],
            'contact_number': validated_data.get('contact_number', ''),
            'sale_date': validated_data['sale_date'],
            'served_by': validated_data['served_by'],
            'payment_method': validated_data['payment_method'],
            'notes': validated_data.get('notes', ''),
            'items': validated_data['items'],
        })
