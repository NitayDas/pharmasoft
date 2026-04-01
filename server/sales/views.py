from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Sale
from .serializers import ProductSerializer, SaleCreateSerializer, SaleSerializer


class ProductListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(is_active=True).order_by('name')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)


class SaleCreateView(APIView):
    permission_classes = [IsAuthenticated]

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
