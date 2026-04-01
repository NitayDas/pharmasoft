from django.urls import path

from .views import DashboardSummaryView, LatestSaleView, ProductListView, SaleCreateView

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('invoices/', SaleCreateView.as_view(), name='invoice-create'),
    path('latest/', LatestSaleView.as_view(), name='latest-sale'),
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]
