# library/signals.py
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile, UserNotificationPreference, UserAchievement

logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def handle_user_profile(sender, instance, created, **kwargs):
    """
    Robust signal handler for UserProfile creation
    """
    try:
        if created:
            # Check if profile already exists (shouldn't for new users)
            if not UserProfile.objects.filter(user=instance).exists():
                UserProfile.objects.create(
                    user=instance, 
                    user_type='student'  # Default role
                )
                logger.info(f"Created UserProfile for new user: {instance.username}")
            else:
                logger.warning(f"UserProfile already exists for new user: {instance.username}")
        else:
            # Update existing profile if needed
            if hasattr(instance, 'userprofile'):
                instance.userprofile.save()
                
    except Exception as e:
        logger.error(f"Error in user profile signal for {instance.username}: {str(e)}")
        # Don't raise exception to avoid breaking user creation


# Add to signals.py
# Add to library/signals.py
@receiver(post_save, sender=User)
def create_user_notification_preferences(sender, instance, created, **kwargs):
    """
    Automatically create notification preferences when a new user is created
    """
    if created:
        UserNotificationPreference.objects.create(user=instance)
        logger.info(f"Created notification preferences for user: {instance.username}")

# Add achievement notification signal
@receiver(post_save, sender=UserAchievement)
def handle_achievement_earned(sender, instance, created, **kwargs):
    """
    Send notification when user earns an achievement
    """
    if created:
        from .notification_utils import NotificationManager
        NotificationManager.create_achievement_notification(instance.user, instance.achievement)
        logger.info(f"Achievement notification sent for {instance.user.username}")