from django.urls import path

from .views import (
    StaffActivateView,
    StaffChangePasswordView,
    StaffDetailView,
    StaffListCreateView,
    StaffMeView,
)

urlpatterns = [
    path('', StaffListCreateView.as_view(), name='staff-list-create'),
    path('me/', StaffMeView.as_view(), name='staff-me'),
    path('<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('<int:pk>/change-password/', StaffChangePasswordView.as_view(), name='staff-change-password'),
    path('<int:pk>/activate/', StaffActivateView.as_view(), name='staff-activate'),
]
