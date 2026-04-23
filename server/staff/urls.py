from django.urls import path

from .views import (
    StaffActivateView,
    StaffChangePasswordView,
    StaffDetailView,
    StaffListCreateView,
)

urlpatterns = [
    path('', StaffListCreateView.as_view(), name='staff-list-create'),
    path('<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('<int:pk>/change-password/', StaffChangePasswordView.as_view(), name='staff-change-password'),
    path('<int:pk>/activate/', StaffActivateView.as_view(), name='staff-activate'),
]
