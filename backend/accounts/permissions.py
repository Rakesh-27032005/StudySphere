from rest_framework.permissions import BasePermission
class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and
                    (request.user.role == "admin" or request.user.is_superuser))
