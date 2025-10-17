# library/audit_utils.py
import logging
from django.utils import timezone
from .models import AuditLog

logger = logging.getLogger(__name__)

class AuditLogger:
    """
    Utility class for logging security events
    """
    
    @staticmethod
    def log_security_event(request, action_type, description, metadata=None):
        """
        Log a security-related event
        """
        try:
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action_type=action_type,
                description=description,
                ip_address=_get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata=metadata or {}
            )
            logger.info(f"Audit log: {action_type} - {description}")
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
    
    @staticmethod
    def log_role_change(request, target_user, old_role, new_role):
        """
        Log user role changes
        """
        description = f"Changed {target_user.username} role from {old_role} to {new_role}"
        metadata = {
            'target_user_id': target_user.id,
            'target_username': target_user.username,
            'old_role': old_role,
            'new_role': new_role,
        }
        AuditLogger.log_security_event(request, 'role_change', description, metadata)
    
    @staticmethod
    def log_permission_denied(request, action_description):
        """
        Log permission denied events
        """
        description = f"Permission denied for {action_description}"
        metadata = {
            'attempted_action': action_description,
        }
        AuditLogger.log_security_event(request, 'permission_denied', description, metadata)

def _get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip