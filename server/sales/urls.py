from django.urls import path

from .views import (
    CustomerCreateView,
    CustomerDetailView,
    CustomerGetByPhoneView,
    CustomerLedgerView,
    CustomerListView,
    DashboardSummaryView,
    InvoicePaymentListCreateView,
    LatestSaleView,
    ProductDetailView,
    ProductListView,
    ProductPurchaseImportHistoryDetailView,
    ProductPurchaseImportHistoryListView,
    ProductPurchaseImportView,
    SaleCreateView,
    SaleDetailView,
    SalesPaymentListView,
)

urlpatterns = [
    # Products
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/purchase-import/', ProductPurchaseImportView.as_view(), name='product-purchase-import'),
    path('products/purchase-import/history/', ProductPurchaseImportHistoryListView.as_view(), name='product-purchase-import-history'),
    path('products/purchase-import/history/<int:pk>/', ProductPurchaseImportHistoryDetailView.as_view(), name='product-purchase-import-history-detail'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),

    # Invoices / Sales
    path('invoices/', SaleCreateView.as_view(), name='invoice-list-create'),
    path('invoices/<int:pk>/', SaleDetailView.as_view(), name='invoice-detail'),
    path('invoices/<int:pk>/payments/', InvoicePaymentListCreateView.as_view(), name='invoice-payments'),

    # Payments overview (Sales/Payments page)
    path('payments/', SalesPaymentListView.as_view(), name='sales-payment-list'),

    # Dashboard + Latest
    path('latest/', LatestSaleView.as_view(), name='latest-sale'),
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),

    # Customers
    path('customers/', CustomerListView.as_view(), name='customer-list'),
    path('customers/create/', CustomerCreateView.as_view(), name='customer-create'),
    path('customers/<int:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/<int:pk>/ledger/', CustomerLedgerView.as_view(), name='customer-ledger'),
    path('customers/<str:phone>/', CustomerGetByPhoneView.as_view(), name='customer-by-phone'),
]
