# library/login_security.py
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class LoginSecurity:
    """
    Handle login security and rate limiting
    """
    
    @staticmethod
    def check_login_attempts(username):
        """
        Check if user has exceeded login attempts
        """
        attempt_key = f'login_attempts_{username}'
        lockout_key = f'login_lockout_{username}'
        
        # Check if user is locked out
        lockout_until = cache.get(lockout_key)
        if lockout_until and lockout_until > timezone.now():
            remaining = (lockout_until - timezone.now()).seconds // 60
            logger.warning(f"Login locked out for user: {username}, {remaining} minutes remaining")
            return False, f"Too many login attempts. Try again in {remaining} minutes."
        
        # Get current attempt count
        attempts = cache.get(attempt_key, 0)
        return True, attempts
    
    @staticmethod
    def record_failed_attempt(username):
        """
        Record a failed login attempt
        """
        attempt_key = f'login_attempts_{username}'
        lockout_key = f'login_lockout_{username}'
        
        # Increment attempt count
        attempts = cache.get(attempt_key, 0) + 1
        cache.set(attempt_key, attempts, timeout=3600)  # 1 hour
        
        # Lockout after 5 failed attempts
        if attempts >= 5:
            lockout_until = timezone.now() + timedelta(minutes=30)
            cache.set(lockout_key, lockout_until, timeout=1800)  # 30 minutes
            logger.warning(f"Login locked out for user: {username} after {attempts} attempts")
        
        return attempts
    
    @staticmethod
    def clear_login_attempts(username):
        """
        Clear login attempts on successful login
        """
        attempt_key = f'login_attempts_{username}'
        lockout_key = f'login_lockout_{username}'
        
        cache.delete(attempt_key)
        cache.delete(lockout_key)