# library/notification_utils.py
import logging
from django.utils import timezone
from .models import Notification, UserNotificationPreference
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class NotificationManager:
    @staticmethod
    def create_notification(user, notification_type, title, message,
                            related_book=None, related_transaction=None, action_url=None):
        """
        Create a new notification for a user
        """
        try:
            notification = Notification.objects.create(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
                related_book=related_book,
                related_transaction=related_transaction,
                action_url=action_url
            )

            # Send email if user has preferences for this type
            NotificationManager.send_email_notification(notification)

            logger.info(f"Notification created for {user.username}: {title}")
            return notification

        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None

    @staticmethod
    def send_email_notification(notification):
        """
        Send email notification based on user preferences
        """
        try:
            preferences, created = UserNotificationPreference.objects.get_or_create(
                user=notification.user
            )

            # Check if user wants email for this notification type
            should_send_email = False
            if notification.notification_type == 'due_reminder' and preferences.email_due_reminders:
                should_send_email = True
            elif notification.notification_type == 'overdue' and preferences.email_overdue_alerts:
                should_send_email = True
            elif notification.notification_type == 'fine' and preferences.email_fine_notifications:
                should_send_email = True
            elif notification.notification_type == 'achievement' and preferences.email_achievements:
                should_send_email = True
            elif notification.notification_type == 'book_available' and preferences.email_book_available:
                should_send_email = True

            if should_send_email:
                # ✅ ADD THIS LINE for critical emails:
                if notification.notification_type in ['overdue', 'fine']:
                    send_critical_email_notification(notification)
                else:
                    # Regular email for non-critical notifications
                    subject = f"Infinitum Library - {notification.title}"
                    html_message = render_to_string('notification_email.html', {
                        'notification': notification,
                        'user': notification.user
                    })
                    plain_message = strip_tags(html_message)
                
                    send_mail(
                        subject=subject,
                        message=plain_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[notification.user.email],
                        html_message=html_message,
                        fail_silently=True,
                    )
                    
                logger.info(
                    f"Email notification sent to {notification.user.email}")

        except Exception as e:
            logger.error(f"Error sending email notification: {e}")

    # In notification_utils.py - enhance email sending


    def send_critical_email_notification(notification):
        """
        Send email for critical notifications (overdue, high fines)
        """
        try:
            if notification.notification_type in ['overdue', 'fine']:
                subject = f"🚨 URGENT: {notification.title}"

                # Create urgent email template
                html_message = render_to_string('critical_notification_email.html', {
                    'notification': notification,
                    'user': notification.user,
                    'current_year': timezone.now().year
                })
                plain_message = strip_tags(html_message)

                send_mail(
                    subject=subject,
                    message=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[notification.user.email],
                    html_message=html_message,
                    fail_silently=True,  # Change to False if you want to see email errors
                )
                logger.info(f"📧 Critical email sent to {notification.user.email}")
        except Exception as e:
            logger.error(f"Error sending critical email: {e}")

    @staticmethod
    def create_due_date_reminder(transaction):
        """
        Create due date reminder notification
        """
        days_until_due = (transaction.due_date.date() -
                          timezone.now().date()).days

        if days_until_due in [1, 3, 7]:  # Remind 1, 3, and 7 days before due date
            title = f"Book Due Soon: {transaction.book.title}"
            message = f"Your book '{transaction.book.title}' is due in {days_until_due} day(s). Please return it by {transaction.due_date.strftime('%B %d, %Y')} to avoid fines."

            return NotificationManager.create_notification(
                user=transaction.user,
                notification_type='due_reminder',
                title=title,
                message=message,
                related_book=transaction.book,
                related_transaction=transaction,
                action_url=f"/my-borrows"
            )
        return None

    @staticmethod
    def create_overdue_notification(transaction):
        """
        Create overdue book notification
        """
        days_overdue = (timezone.now().date() -
                        transaction.due_date.date()).days

        title = f"Book Overdue: {transaction.book.title}"
        message = f"Your book '{transaction.book.title}' is {days_overdue} day(s) overdue. Please return it immediately to avoid accumulating fines."

        return NotificationManager.create_notification(
            user=transaction.user,
            notification_type='overdue',
            title=title,
            message=message,
            related_book=transaction.book,
            related_transaction=transaction,
            action_url=f"/my-borrows"
        )

    @staticmethod
    def create_achievement_notification(user, achievement):
        """
        Create achievement earned notification
        """
        title = f"Achievement Unlocked: {achievement.name}"
        message = f"Congratulations! You've earned the achievement: {achievement.name}. {achievement.description}"

        return NotificationManager.create_notification(
            user=user,
            notification_type='achievement',
            title=title,
            message=message,
            action_url=f"/reading-dashboard"
        )

    @staticmethod
    def create_book_available_notification(user, book):
        """
        Create notification when a previously unavailable book becomes available
        """
        title = f"Book Available: {book.title}"
        message = f"Great news! '{book.title}' by {book.author} is now available for borrowing."

        return NotificationManager.create_notification(
            user=user,
            notification_type='book_available',
            title=title,
            message=message,
            related_book=book,
            action_url=f"/books/{book.id}"
        )
