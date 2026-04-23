from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Staff
from .permissions import IsAdminOrSuperuser, IsAdminSuperuserOrSelf
from .serializers import (
    ChangePasswordSerializer,
    StaffCreateSerializer,
    StaffListSerializer,
    StaffUpdateSerializer,
)


class StaffListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrSuperuser()]
        return [IsAuthenticated()]

    def get(self, request):
        queryset = Staff.objects.select_related('user', 'created_by').all()

        # Non-admin staff can only see themselves
        if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'):
            queryset = queryset.filter(user=request.user)

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                user__first_name__icontains=search
            ) | queryset.filter(
                user__last_name__icontains=search
            ) | queryset.filter(
                user__username__icontains=search
            ) | queryset.filter(
                user__email__icontains=search
            ) | queryset.filter(
                employee_id__icontains=search
            )

        role_filter = request.query_params.get('role', '').strip()
        if role_filter:
            queryset = queryset.filter(role=role_filter)

        is_active = request.query_params.get('is_active', '').strip()
        if is_active in ('true', 'false'):
            queryset = queryset.filter(is_active=(is_active == 'true'))

        serializer = StaffListSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = StaffCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            staff = serializer.save()
            return Response(
                StaffListSerializer(staff).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffDetailView(APIView):
    def _get_staff(self, pk):
        return get_object_or_404(Staff.objects.select_related('user', 'created_by'), pk=pk)

    def _check_read_permission(self, request, staff):
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'admin':
            return True
        return staff.user == request.user

    def get(self, request, pk):
        staff = self._get_staff(pk)
        if not self._check_read_permission(request, staff):
            return Response(
                {'detail': 'You do not have permission to view this staff member.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(StaffListSerializer(staff).data)

    def patch(self, request, pk):
        if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'):
            return Response(
                {'detail': 'Only admins or superusers can update staff.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        staff = self._get_staff(pk)
        serializer = StaffUpdateSerializer(staff, data=request.data, partial=True)
        if serializer.is_valid():
            staff = serializer.save()
            return Response(StaffListSerializer(staff).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'):
            return Response(
                {'detail': 'Only admins or superusers can deactivate staff.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        staff = self._get_staff(pk)
        staff.is_active = False
        staff.user.is_active = False
        staff.user.save()
        staff.save()
        return Response({'detail': 'Staff member deactivated successfully.'}, status=status.HTTP_200_OK)


class StaffChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        staff = get_object_or_404(Staff.objects.select_related('user'), pk=pk)
        is_admin = request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'
        is_self = staff.user == request.user

        if not (is_admin or is_self):
            return Response(
                {'detail': 'You can only change your own password.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Self-change requires old password verification
        if is_self and not is_admin:
            old_password = serializer.validated_data.get('old_password', '')
            if not old_password:
                return Response(
                    {'old_password': 'Current password is required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not staff.user.check_password(old_password):
                return Response(
                    {'old_password': 'Current password is incorrect.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        staff.user.set_password(serializer.validated_data['new_password'])
        staff.user.save()
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class StaffActivateView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def post(self, request, pk):
        staff = get_object_or_404(Staff, pk=pk)
        staff.is_active = True
        staff.user.is_active = True
        staff.user.save()
        staff.save()
        return Response({'detail': 'Staff member activated successfully.'}, status=status.HTTP_200_OK)
