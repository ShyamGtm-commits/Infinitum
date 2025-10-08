# management/commands/cleanup_expired_qrs.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from library.models import Transaction

class Command(BaseCommand):
    help = 'Clean up expired QR codes'
    
    def handle(self, *args, **options):
        # Find all pending transactions that have expired
        expired_transactions = Transaction.objects.filter(
            status='pending',
            qr_generated_at__lte=timezone.now() - timedelta(hours=24)
        )
        
        count = expired_transactions.update(status='cancelled')
        self.stdout.write(f'Cancelled {count} expired QR transactions')