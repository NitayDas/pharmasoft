from django.urls import path

from .views import (
    PurchaseEntryDetailView,
    PurchaseEntryListView,
    PurchaseExcelImportView,
    PurchaseManualEntryView,
)

urlpatterns = [
    path("entries/", PurchaseEntryListView.as_view(), name="purchase-entry-list"),
    path("entries/manual/", PurchaseManualEntryView.as_view(), name="purchase-entry-manual"),
    path("entries/import/", PurchaseExcelImportView.as_view(), name="purchase-entry-import"),
    path("entries/<int:pk>/", PurchaseEntryDetailView.as_view(), name="purchase-entry-detail"),
]

