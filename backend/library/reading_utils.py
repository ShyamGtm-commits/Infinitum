# Create new file: library/reading_utils.py
import logging
from django.utils import timezone
from .models import Achievement, UserAchievement, Transaction, BookRating, BookReview
from django.db.models import Count

logger = logging.getLogger(__name__)

# In reading_utils.py - UPDATE with debug logging


def check_and_award_achievements(user):
    """
    Check if user qualifies for any achievements and award them
    """
    try:
        from .notification_utils import NotificationManager
        achievements = Achievement.objects.all()
        awarded = []

        print(f"🔍 Checking achievements for user: {user.username}")
        print(f"🔍 Total achievements in system: {achievements.count()}")

        for achievement in achievements:
            print(
                f"🔍 Checking achievement: {achievement.name} (type: {achievement.achievement_type})")

            # Check if user already has this achievement
            if UserAchievement.objects.filter(user=user, achievement=achievement).exists():
                print(f"🔍 User already has achievement: {achievement.name}")
                continue

            progress = 0
            earned = False

            if achievement.achievement_type == 'books_read':
                books_read = Transaction.objects.filter(
                    user=user, return_date__isnull=False).count()
                progress = books_read
                earned = progress >= achievement.requirement
                print(
                    f"📚 Books read: {books_read}, Required: {achievement.requirement}, Earned: {earned}")

            elif achievement.achievement_type == 'genres_explored':
                unique_genres = Transaction.objects.filter(
                    user=user,
                    return_date__isnull=False
                ).values('book__genre').distinct().count()
                progress = unique_genres
                earned = progress >= achievement.requirement
                print(
                    f"🎭 Unique genres: {unique_genres}, Required: {achievement.requirement}, Earned: {earned}")

            elif achievement.achievement_type == 'reviewer':
                reviews_count = BookReview.objects.filter(user=user).count()
                progress = reviews_count
                earned = progress >= achievement.requirement
                print(
                    f"✍️ Reviews written: {reviews_count}, Required: {achievement.requirement}, Earned: {earned}")

            elif achievement.achievement_type == 'speed_reader':
                # Books read in current month
                from datetime import timedelta
                month_start = timezone.now().replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0)
                monthly_books = Transaction.objects.filter(
                    user=user,
                    return_date__isnull=False,
                    return_date__gte=month_start
                ).count()
                progress = monthly_books
                earned = progress >= achievement.requirement
                print(
                    f"⚡ Monthly books: {monthly_books}, Required: {achievement.requirement}, Earned: {earned}")

            if earned:
                # Award achievement
                user_achievement = UserAchievement.objects.create(
                    user=user, achievement=achievement)
                awarded.append(achievement.name)

                # Send notification
                NotificationManager.create_achievement_notification(
                    user, achievement)

                print(f"🎉 AWARDED: {achievement.name} to {user.username}")
                logger.info(f"Awarded {achievement.name} to {user.username}")
            elif progress > 0:
                # Update progress if not earned
                user_achievement, created = UserAchievement.objects.get_or_create(
                    user=user,
                    achievement=achievement,
                    defaults={'progress': progress}
                )
                if not created and user_achievement.progress != progress:
                    user_achievement.progress = progress
                    user_achievement.save()
                print(
                    f"📊 Progress updated: {achievement.name} - {progress}/{achievement.requirement}")

        print(f"✅ Achievement check complete. Awarded: {awarded}")
        return awarded

    except Exception as e:
        print(f"❌ Error in achievement check: {e}")
        logger.error(f"Error awarding achievements: {e}")
        return []


# ADD to your existing reading_utils.py - at the bottom

def check_achievements_on_book_return(user, book):
    """
    Automatically check achievements when a book is returned
    """
    try:
        awarded = check_and_award_achievements(user)
        if awarded:
            logger.info(
                f"🎉 Auto-awarded achievements for {user.username}: {awarded}")
        return awarded
    except Exception as e:
        logger.error(f"Error in auto achievement check: {e}")
        return []


def check_achievements_on_review(user):
    """
    Automatically check achievements when a review is written
    """
    try:
        awarded = check_and_award_achievements(user)
        if awarded:
            logger.info(
                f"🎉 Auto-awarded review achievements for {user.username}: {awarded}")
        return awarded
    except Exception as e:
        logger.error(f"Error in review achievement check: {e}")
        return []
