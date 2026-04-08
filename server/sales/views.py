from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Sale, Customer
from .serializers import ProductSerializer, SaleCreateSerializer, SaleSerializer, CustomerSerializer


class ProductListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', '').strip().lower()

        products = Product.objects.select_related('stock').all().order_by('name')
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(batch__icontains=search) |
                Q(unit__icontains=search)
            )
        if status_filter == 'active':
            products = products.filter(is_active=True)
        elif status_filter == 'inactive':
            products = products.filter(is_active=False)

        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return Product.objects.get(pk=pk)

    def get(self, request, pk):
        try:
            product = Product.objects.select_related('stock').get(pk=pk)
            return Response(ProductSerializer(product).data)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            product = self.get_object(pk)
            serializer = ProductSerializer(product, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            product = self.get_object(pk)
            serializer = ProductSerializer(product, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            product = self.get_object(pk)
            product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)


class SaleCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sales = Sale.objects.prefetch_related('items').select_related('served_by', 'customer').all().order_by('-created_at')
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


class LatestSaleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sale = Sale.objects.prefetch_related('items', 'served_by').order_by('-created_at').first()
        if not sale:
            return Response({'sale': None})
        return Response({'sale': SaleSerializer(sale).data})


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        sales_today = Sale.objects.filter(sale_date=today)
        summary = sales_today.aggregate(
            total_sales=Coalesce(Sum('grand_total'), 0),
            total_discount=Coalesce(Sum('discount_amount'), 0),
            sale_count=Count('id'),
        )
        latest_sale = Sale.objects.prefetch_related('items', 'served_by').order_by('-created_at').first()

        return Response({
            'today': str(today),
            'total_sales': summary['total_sales'],
            'total_discount': summary['total_discount'],
            'sale_count': summary['sale_count'],
            'latest_sale': SaleSerializer(latest_sale).data if latest_sale else None,
        })


class CustomerCreateView(APIView):
    """Create a new customer."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CustomerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerGetByPhoneView(APIView):
    """Get customer by phone number."""
    permission_classes = [IsAuthenticated]

    def get(self, request, phone):
        try:
            customer = Customer.objects.get(phone=phone)
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response({'detail': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)


class CustomerListView(APIView):
    """List all customers."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        customers = Customer.objects.all().order_by('name')
        if search:
            customers = customers.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search)
            )
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)


class CustomerDetailView(APIView):
    """Retrieve, update, or delete a customer."""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return Customer.objects.get(pk=pk)

    def get(self, request, pk):
        try:
            customer = self.get_object(pk)
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response({'detail': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            customer = self.get_object(pk)
            serializer = CustomerSerializer(customer, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Customer.DoesNotExist:
            return Response({'detail': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            customer = self.get_object(pk)
            serializer = CustomerSerializer(customer, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Customer.DoesNotExist:
            return Response({'detail': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            customer = self.get_object(pk)
            customer.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Customer.DoesNotExist:
            return Response({'detail': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)
