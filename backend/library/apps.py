# library/apps.py
from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class LibraryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'library'

    def ready(self):
        # Import and connect signals
        try:
            from . import signals
            logger.info("Library signals loaded successfully")
        except Exception as e:
            logger.error(f"Error loading signals: {e}")
        
        # Background tasks - ONLY QR cleanup remains
        try:
            from . import tasks
            # Existing QR cleanup task only
            tasks.cleanup_expired_qrs_task()
            
            logger.info("Background tasks scheduled successfully")
        except Exception as e:
            logger.error(f"Error scheduling background tasks: {e}")

        # Start automated notification tasks
        try:
            from . import tasks
            if not self.__class__.tasks_started:
                tasks.check_due_date_reminders()
                tasks.check_overdue_books()
                self.__class__.tasks_started = True
                logger.info("✅ Automated notification tasks started")
        except Exception as e:
            logger.error(f"Error starting automated tasks: {e}")