# library/permissions.py
from rest_framework import permissions
import logging

logger = logging.getLogger(__name__)

class IsSuperUser(permissions.BasePermission):
    """
    Allows access only to superusers.
    """
    def has_permission(self, request, view):
        is_superuser = bool(request.user and request.user.is_superuser)
        if not is_superuser:
            logger.warning(f"Superuser access denied for user: {request.user.username}")
        return is_superuser

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users (superusers or app admins).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superusers have all access
        if request.user.is_superuser:
            return True
            
        # Check if user has admin role in UserProfile
        try:
            from .models import UserProfile
            profile = UserProfile.objects.get(user=request.user)
            is_admin = profile.user_type == 'admin'
            if not is_admin:
                logger.warning(f"Admin access denied for user: {request.user.username} (role: {profile.user_type})")
            return is_admin
        except UserProfile.DoesNotExist:
            logger.warning(f"Admin access denied - no profile for user: {request.user.username}")
            return False

class IsLibrarianUser(permissions.BasePermission):
    """
    Allows access to librarians and above (admin, superuser).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superusers and admins have all access
        if request.user.is_superuser:
            return True
            
        try:
            from .models import UserProfile
            profile = UserProfile.objects.get(user=request.user)
            allowed_roles = ['admin', 'librarian']
            is_allowed = profile.user_type in allowed_roles
            if not is_allowed:
                logger.warning(f"Librarian access denied for user: {request.user.username} (role: {profile.user_type})")
            return is_allowed
        except UserProfile.DoesNotExist:
            logger.warning(f"Librarian access denied - no profile for user: {request.user.username}")
            return False

class IsStaffUser(permissions.BasePermission):
    """
    Allows access to staff and above (teacher, librarian, admin, superuser).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superusers have all access
        if request.user.is_superuser:
            return True
            
        try:
            from .models import UserProfile
            profile = UserProfile.objects.get(user=request.user)
            allowed_roles = ['admin', 'librarian', 'teacher']
            is_allowed = profile.user_type in allowed_roles
            return is_allowed
        except UserProfile.DoesNotExist:
            return False