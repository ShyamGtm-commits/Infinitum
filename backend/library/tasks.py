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