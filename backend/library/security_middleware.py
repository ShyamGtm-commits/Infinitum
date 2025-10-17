# library/security_middleware.py
import logging
from django.utils.deprecation import MiddlewareMixin
from .audit_utils import AuditLogger

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to all responses
    """
    def process_response(self, request, response):
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # CSP for production - adjust as needed
        if not request.path.startswith('/admin/'):
            response['Content-Security-Policy'] = "default-src 'self'"
        
        return response

class AuditMiddleware(MiddlewareMixin):
    """
    Log security-related events
    """
    def process_response(self, request, response):
        # Log admin actions and permission denials
        if hasattr(request, 'user') and request.user.is_authenticated:
            if request.path.startswith('/api/admin/') and request.method in ['POST', 'PUT', 'DELETE']:
                if response.status_code == 200:
                    action = f"{request.method} {request.path}"
                    AuditLogger.log_security_event(
                        request, 
                        'admin_action', 
                        f"Admin action performed: {action}"
                    )
        
        return response