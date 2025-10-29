# library/tasks.py
from background_task import background
from django.utils import timezone
from datetime import timedelta
from .models import Transaction
from .notification_utils import NotificationManager
import logging

logger = logging.getLogger(__name__)

@background(schedule=60)  # Run every 60 minutes
def cleanup_expired_qrs_task():
    """
    Background task to clean up expired QR codes
    """
    from .models import Transaction
    
    # Find all pending transactions that have expired
    expired_transactions = Transaction.objects.filter(
        status='pending',
        qr_generated_at__lte=timezone.now() - timedelta(hours=24)
    )
    
    count = expired_transactions.update(status='cancelled')
    print(f'Cancelled {count} expired QR transactions')

@background(schedule=60)
def check_due_date_reminders():
    """
    Automated due date reminders - runs every hour
    """
    tomorrow = timezone.now().date() + timedelta(days=1)
    three_days = timezone.now().date() + timedelta(days=3)
    seven_days = timezone.now().date() + timedelta(days=7)
    
    # Find transactions due soon
    upcoming_due = Transaction.objects.filter(
        return_date__isnull=True,
        due_date__date__in=[tomorrow, three_days, seven_days]
    )
    
    for transaction in upcoming_due:
        days_until_due = (transaction.due_date.date() - timezone.now().date()).days
        NotificationManager.create_due_date_reminder(transaction)
    
    print(f"✅ Due date check: {upcoming_due.count()} books due soon")

@background(schedule=60)
def check_overdue_books():
    """
    Automated overdue notifications - runs every hour
    """
    overdue_transactions = Transaction.objects.filter(
        return_date__isnull=True,
        due_date__lt=timezone.now()
    )
    
    for transaction in overdue_transactions:
        NotificationManager.create_overdue_notification(transaction)
    
    print(f"⚠️ Overdue check: {overdue_transactions.count()} books overdue")

# Schedule tasks
check_due_date_reminders(repeat=3600)  # Every hour
check_overdue_books(repeat=3600)       # Every hour

@background(schedule=3600)  # Run every hour
def cleanup_waitlist_task():
    """
    Clean up expired waitlist entries
    """
    from .utils import cleanup_expired_waitlist
    count = cleanup_expired_waitlist()
    print(f'Cleaned up {count} expired waitlist entries')

# Schedule the task
cleanup_waitlist_task(repeat=3600)  # Every hour

# Add to existing tasks.py
@background(schedule=60)  # Run every hour
def check_reservation_expiry():
    """
    Check for reservations expiring soon and send notifications
    """
    from .models import Transaction
    from .notification_utils import NotificationManager
    
    # Find reservations expiring in the next 6 hours
    expiry_threshold = timezone.now() + timedelta(hours=6)
    expiring_reservations = Transaction.objects.filter(
        status='pending',
        qr_generated_at__isnull=False,
        qr_generated_at__lte=expiry_threshold
    ).select_related('book', 'user')
    
    for transaction in expiring_reservations:
        hours_remaining = int((transaction.get_qr_expiry_time() - timezone.now()).total_seconds() / 3600)
        if 1 <= hours_remaining <= 6:  # Only notify if between 1-6 hours left
            NotificationManager.send_reservation_expiring(
                user=transaction.user,
                book=transaction.book,
                hours_remaining=hours_remaining,
                transaction=transaction
            )
    
    print(f"✅ Reservation expiry check: {expiring_reservations.count()} reservations expiring soon")

@background(schedule=3600)  # Run every hour
def send_pickup_reminders():
    """
    Send reminders for reservations that haven't been picked up
    """
    from .models import Transaction
    from .notification_utils import NotificationManager
    
    # Find reservations created more than 2 hours ago but not picked up
    reminder_threshold = timezone.now() - timedelta(hours=2)
    pending_pickups = Transaction.objects.filter(
        status='pending',
        qr_generated_at__lte=reminder_threshold,
        issued_at__isnull=True  # Not yet picked up
    ).select_related('book', 'user')
    
    for transaction in pending_pickups:
        NotificationManager.send_pickup_reminder(
            user=transaction.user,
            book=transaction.book,
            transaction=transaction
        )
    
    print(f"📚 Pickup reminders: {pending_pickups.count()} reminders sent")

# Schedule the new tasks
check_reservation_expiry(repeat=3600)  # Every hour
send_pickup_reminders(repeat=7200)     # Every 2 hours