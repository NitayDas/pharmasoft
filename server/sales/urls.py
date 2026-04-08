from django.urls import path

from .views import (
    DashboardSummaryView, LatestSaleView, ProductListView, ProductDetailView, SaleCreateView,
    CustomerCreateView, CustomerGetByPhoneView, CustomerListView, CustomerDetailView
)

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('invoices/', SaleCreateView.as_view(), name='invoice-create'),
    path('latest/', LatestSaleView.as_view(), name='latest-sale'),
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('customers/', CustomerListView.as_view(), name='customer-list'),
    path('customers/create/', CustomerCreateView.as_view(), name='customer-create'),
    path('customers/<int:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/<str:phone>/', CustomerGetByPhoneView.as_view(), name='customer-by-phone'),
    path('customers/<int:pk>/update/', CustomerDetailView.as_view(), name='customer-update'),
]
