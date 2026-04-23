from rest_framework.permissions import BasePermission


class IsAdminOrSuperuser(BasePermission):
    """Allow access only to superusers or staff with 'admin' role."""

    message = 'Only admins or superusers can perform this action.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'


class IsAdminSuperuserOrSelf(BasePermission):
    """Allow access to admin/superuser, or to the staff member themselves."""

    message = 'You can only access your own profile.'

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'admin':
            return True
        return obj.user == request.user
