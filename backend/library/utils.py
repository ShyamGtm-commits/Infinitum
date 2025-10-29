# library/utils.py
import random
import logging
import qrcode
import base64
from io import BytesIO
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .models import BookWaitlist

# Set up logger
logger = logging.getLogger(__name__)

def generate_otp(length=6):
    """Generate a random numeric OTP of given length."""
    # Generate a random number with 'length' digits, ensuring it has leading zeros if needed.
    # random.randint(100000, 999999) only works for 6 digits.
    # This method works for any length.
    otp = ''.join([str(random.randint(0, 9)) for _ in range(length)])
    return otp

def send_otp_email(email, otp_code):
    """
    Sends an OTP code to the user's email address.
    Returns True if successful, False otherwise.
    """
    subject = 'Your Infinitum Library Verification Code'
    message = f'''
    Welcome to Infinitum Library!

    Your One-Time Password (OTP) for account verification is:

    {otp_code}

    This code will expire in 10 minutes.

    If you did not request this, please ignore this email.

    Happy Reading!
    The Infinitum Library Team
    '''
    from_email = settings.DEFAULT_FROM_EMAIL  # We'll set this in settings.py
    recipient_list = [email]

    try:
        # This is the core Django function for sending email
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        print(f"OTP email sent successfully to {email}") # Good for debugging
        return True
    except Exception as e:
        # It's very important to catch errors here so our server doesn't crash
        # if there's an email configuration problem.
        print(f"Failed to send OTP email to {email}. Error: {str(e)}")
        return False
    

# NEW QR & WAITLIST FUNCTIONS:

def generate_base64_qr(data):
    """
    Generate QR code and return as base64 string
    """
    try:
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return img_str
        
    except Exception as e:
        logger.error(f"QR generation error: {e}")
        raise Exception("Failed to generate QR code")

def add_to_waitlist(user, book):
    """
    Add user to book waitlist and return their position
    """
    try:
        # Check if user is already in waitlist
        existing = BookWaitlist.objects.filter(user=user, book=book).first()
        if existing:
            return existing
        
        # Get last position in waitlist for this book
        last_position = BookWaitlist.objects.filter(book=book).aggregate(
            models.Max('position')
        )['position__max'] or 0
        
        # Create new waitlist entry
        waitlist_entry = BookWaitlist.objects.create(
            user=user,
            book=book,
            position=last_position + 1
        )
        
        # Log waitlist addition
        logger.info(f"User {user.username} added to waitlist for {book.title} at position {waitlist_entry.position}")
        
        return waitlist_entry
        
    except Exception as e:
        logger.error(f"Waitlist error: {e}")
        raise Exception("Failed to add to waitlist")

def estimate_wait_time(position):
    """
    Estimate wait time based on position and historical data
    """
    try:
        # Simple estimation: 3 days per position (adjust based on your data)
        days_per_position = 3
        estimated_days = position * days_per_position
        
        if estimated_days == 1:
            return "approximately 1 day"
        elif estimated_days < 7:
            return f"approximately {estimated_days} days"
        elif estimated_days < 30:
            weeks = estimated_days // 7
            return f"approximately {weeks} week{'s' if weeks > 1 else ''}"
        else:
            months = estimated_days // 30
            return f"approximately {months} month{'s' if months > 1 else ''}"
            
    except Exception as e:
        logger.error(f"Wait time estimation error: {e}")
        return "some time"  # Fallback
    
def notify_waitlist_users(book):
    """
    Notify waitlisted users when a book becomes available
    """
    try:
        from .notification_utils import NotificationManager
        
        # Get first user in waitlist for this book (active entries only)
        waitlist_entry = BookWaitlist.objects.filter(
            book=book,
            expires_at__isnull=True  # Active entries only
        ).order_by('position').first()
        
        if waitlist_entry:
            # Notify the user
            NotificationManager.create_notification(
                user=waitlist_entry.user,
                notification_type='book_available',
                title='📚 Book Available!',
                message=f'"{book.title}" is now available! You are next in line. You have 24 hours to borrow it.',
                related_book=book,
                action_url=f'/books/{book.id}'
            )
            
            # Mark as notified and set expiry (24 hours to claim)
            waitlist_entry.notified_at = timezone.now()
            waitlist_entry.expires_at = timezone.now() + timedelta(hours=24)
            waitlist_entry.save()
            
            logger.info(f"Notified waitlist user {waitlist_entry.user.username} for book {book.title}")
            return True
            
        return False
            
    except Exception as e:
        logger.error(f"Error notifying waitlist users: {e}")
        return False
    
def get_waitlist_position(user, book):
    """Get user's position in waitlist for a book"""
    try:
        entry = BookWaitlist.objects.filter(book=book, user=user).first()
        return entry.position if entry else None
    except Exception as e:
        logger.error(f"Error getting waitlist position: {e}")
        return None

def cleanup_expired_waitlist():
    """Remove expired waitlist entries (run as background task)"""
    try:
        expired_entries = BookWaitlist.objects.filter(
            expires_at__lte=timezone.now()
        )
        count = expired_entries.count()
        expired_entries.delete()
        
        if count > 0:
            logger.info(f"Cleaned up {count} expired waitlist entries")
        return count
    except Exception as e:
        logger.error(f"Error cleaning up waitlist: {e}")
        return 0

def promote_waitlist_users(book):
    """Move users up in waitlist when someone ahead drops out"""
    try:
        # Get all active waitlist entries for this book
        entries = BookWaitlist.objects.filter(
            book=book,
            expires_at__isnull=True
        ).order_by('position')
        
        # Re-number positions starting from 1
        for index, entry in enumerate(entries, start=1):
            if entry.position != index:
                entry.position = index
                entry.save()
                
        logger.info(f"Reorganized waitlist for {book.title}")
        return True
    except Exception as e:
        logger.error(f"Error promoting waitlist users: {e}")
        return False