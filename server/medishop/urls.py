from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/stock/', include('stock.urls')),
    path('api/purchase/', include('purchase.urls')),
    path('api/staff/', include('staff.urls')),
]
