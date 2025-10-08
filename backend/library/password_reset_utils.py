# library/password_reset_utils.py
import secrets
import string
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import PasswordResetToken, User
import logging

logger = logging.getLogger(__name__)

def generate_secure_token(length=32):
    """Generate a cryptographically secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def create_password_reset_token(user_email):
    """
    Create a new password reset token for a user
    Returns the token object if successful, None otherwise
    """
    try:
        user = User.objects.get(email=user_email)
        
        # Invalidate any existing tokens for this user
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Generate secure token
        token = generate_secure_token()
        
        # Create new token (valid for 1 hour)
        reset_token = PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timezone.timedelta(hours=1)
        )
        
        logger.info(f"Password reset token created for {user_email}")
        return reset_token
        
    except User.DoesNotExist:
        logger.warning(f"Password reset attempted for non-existent email: {user_email}")
        return None
    except Exception as e:
        logger.error(f"Error creating password reset token: {e}")
        return None

def send_password_reset_email(user_email, reset_token):
    """
    Send password reset email with secure token
    """
    try:
        reset_url = f"http://localhost:3000/reset-password?token={reset_token.token}"
        
        # HTML email content
        html_message = render_to_string('password_reset_email.html', {
            'user': reset_token.user,
            'reset_url': reset_url,
            'expiry_hours': 1
        })
        
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject='Infinitum Library - Password Reset Request',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Password reset email sent to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending password reset email: {e}")
        return False