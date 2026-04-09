from django.urls import path

from .views import (
    ProductDetailView,
    ProductListView,
    ProductPurchaseImportHistoryDetailView,
    ProductPurchaseImportHistoryListView,
    ProductPurchaseImportView,
)

urlpatterns = [
    path("products/", ProductListView.as_view(), name="stock-product-list"),
    path("products/purchase-import/", ProductPurchaseImportView.as_view(), name="stock-product-purchase-import"),
    path(
        "products/purchase-import/history/",
        ProductPurchaseImportHistoryListView.as_view(),
        name="stock-product-purchase-import-history",
    ),
    path(
        "products/purchase-import/history/<int:pk>/",
        ProductPurchaseImportHistoryDetailView.as_view(),
        name="stock-product-purchase-import-history-detail",
    ),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="stock-product-detail"),
]
