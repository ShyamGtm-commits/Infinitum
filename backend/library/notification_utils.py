# backend/library/notification_utils.py
from .models import Notification, UserNotificationPreference
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class NotificationManager:
    """
    Enhanced Notification Manager with reservation support
    """

    # Notification templates for different types
    NOTIFICATION_TEMPLATES = {
        # RESERVATION NOTIFICATIONS - NEW
        'reservation_confirmation': {
            'title': '📋 Reservation Confirmed!',
            'message': 'Your reservation for "{book_title}" is confirmed. Generate QR code for pickup.'
        },
        'reservation_ready': {
            'title': '✅ Reservation Ready for Pickup!',
            'message': 'Your reserved book "{book_title}" is ready for pickup at the library.'
        },
        'reservation_expiring': {
            'title': '⏰ Reservation Expiring Soon!',
            'message': 'Your reservation for "{book_title}" expires in {hours} hours. Renew QR code if needed.'
        },
        'pickup_reminder': {
            'title': '📚 Pickup Reminder',
            'message': 'Remember to pick up "{book_title}" from the library using your QR code.'
        },

        # EXISTING NOTIFICATIONS
        'book_available': {
            'title': '🎉 Book Available!',
            'message': '"{book_title}" is now available! You are next in line. You have 24 hours to borrow it.'
        },
        'due_reminder': {
            'title': '📅 Due Date Reminder',
            'message': 'Your book "{book_title}" is due on {due_date}. Please return it soon.'
        },
        'overdue': {
            'title': '⚠️ Book Overdue',
            'message': 'Your book "{book_title}" is overdue. Please return it immediately to avoid fines.'
        },
        'fine': {
            'title': '💰 Fine Applied',
            'message': 'A fine of ₹{fine_amount} has been applied for overdue return of "{book_title}".'
        },
        'achievement': {
            'title': '🏆 Achievement Unlocked!',
            'message': 'You earned the "{achievement_name}" achievement!'
        },
        'system': {
            'title': '🔔 System Notification',
            'message': '{message}'
        },
        'welcome': {
            'title': '👋 Welcome to Infinitum Library!',
            'message': 'Welcome {username}! Start exploring our collection of books.'
        }
    }

    @staticmethod
    def create_notification(user, notification_type, title=None, message=None,
                            related_book=None, related_transaction=None, action_url=None):
        """
        Create a notification with enhanced reservation support
        """
        try:
            # Check user preferences
            preferences = UserNotificationPreference.objects.filter(
                user=user).first()

            # If no preferences exist, create default ones
            if not preferences:
                preferences = UserNotificationPreference.objects.create(
                    user=user)

            # Check if user wants this type of notification
            if not NotificationManager._should_send_notification(notification_type, preferences):
                logger.info(
                    f"Notification {notification_type} skipped due to user preferences for {user.username}")
                return None

            # Use template if no custom title/message provided
            if not title or not message:
                template = NotificationManager.NOTIFICATION_TEMPLATES.get(
                    notification_type, {})
                title = title or template.get('title', 'Notification')
                message = message or template.get(
                    'message', 'You have a new notification.')

            # Create the notification
            notification = Notification.objects.create(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
                related_book=related_book,
                related_transaction=related_transaction,
                action_url=action_url
            )

            logger.info(
                f"Notification created for {user.username}: {notification_type}")
            return notification

        except Exception as e:
            logger.error(
                f"Error creating notification for {user.username}: {e}")
            return None

    @staticmethod
    def _should_send_notification(notification_type, preferences):
        """
        Check if notification should be sent based on user preferences
        """
        preference_map = {
            # Reservation notifications
            'reservation_confirmation': preferences.email_reservation_confirmation,
            'reservation_ready': preferences.email_book_available,  # Use existing preference
            'reservation_expiring': preferences.email_due_reminders,  # Use existing preference
            'pickup_reminder': preferences.email_due_reminders,  # Use existing preference

            # Existing notifications
            'due_reminder': preferences.email_due_reminders,
            'overdue': preferences.email_overdue_alerts,
            'fine': preferences.email_fine_notifications,
            'achievement': preferences.email_achievements,
            'book_available': preferences.email_book_available,
            'system': True,  # Always send system notifications
            'welcome': True,  # Always send welcome notifications
        }

        return preference_map.get(notification_type, True)

    # RESERVATION-SPECIFIC NOTIFICATION METHODS - NEW

    @staticmethod
    def send_reservation_confirmation(user, book, transaction=None):
        """Send confirmation when user reserves a book - QUICK FIX"""
        message = f'Your reservation for "{book.title}" is confirmed. Generate QR code for pickup.'

        return NotificationManager.create_notification(
            user=user,
            notification_type='reservation_confirmation',
            title='📋 Reservation Confirmed!',
            message=message,  # Manually formatted message
            related_book=book,
            related_transaction=transaction,
            action_url=f'/books/{book.id}'
        )

    @staticmethod
    def send_reservation_ready(user, book, transaction=None):
        """Send notification when reservation is ready for pickup"""
        return NotificationManager.create_notification(
            user=user,
            notification_type='reservation_ready',
            related_book=book,
            related_transaction=transaction,
            action_url=f'/books/{book.id}'
        )

    @staticmethod
    def send_reservation_expiring(user, book, hours_remaining, transaction=None):
        """Send warning when reservation is about to expire"""
        message = f'Your reservation for "{book.title}" expires in {hours_remaining} hours. Renew QR code if needed.'
        return NotificationManager.create_notification(
            user=user,
            notification_type='reservation_expiring',
            message=message,
            related_book=book,
            related_transaction=transaction,
            action_url=f'/books/{book.id}'
        )

    @staticmethod
    def send_pickup_reminder(user, book, transaction=None):
        """Send reminder to pick up reserved book"""
        return NotificationManager.create_notification(
            user=user,
            notification_type='pickup_reminder',
            related_book=book,
            related_transaction=transaction,
            action_url=f'/books/{book.id}'
        )

    # EXISTING NOTIFICATION METHODS (keep these)

    @staticmethod
    def create_due_date_reminder(transaction):
        """Create due date reminder notification"""
        book = transaction.book
        due_date = transaction.due_date.strftime('%B %d, %Y')
        message = f'Your book "{book.title}" is due on {due_date}. Please return it soon.'

        return NotificationManager.create_notification(
            user=transaction.user,
            notification_type='due_reminder',
            message=message,
            related_book=book,
            related_transaction=transaction,
            action_url='/my-borrows'
        )

    @staticmethod
    def create_overdue_notification(transaction):
        """Create overdue book notification"""
        book = transaction.book
        return NotificationManager.create_notification(
            user=transaction.user,
            notification_type='overdue',
            related_book=book,
            related_transaction=transaction,
            action_url='/my-borrows'
        )

    @staticmethod
    def send_welcome_notification(user):
        """Send welcome notification to new users"""
        message = f'Welcome {user.username}! Start exploring our collection of books.'
        return NotificationManager.create_notification(
            user=user,
            notification_type='welcome',
            message=message,
            action_url='/books'
        )

    @staticmethod
    def send_achievement_notification(user, achievement):
        """Send achievement unlocked notification"""
        return NotificationManager.create_notification(
            user=user,
            notification_type='achievement',
            message=f'You earned the "{achievement.name}" achievement!',
            action_url='/achievements'
        )
