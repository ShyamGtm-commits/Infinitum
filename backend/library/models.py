

from io import BytesIO
from django.core.files import File
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, timedelta
import qrcode
from io import BytesIO
from django.core.files import File
import os
import json
# backend/library/models.py  (append)
from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_save


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance, user_type='student')


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.userprofile.save()
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=instance, user_type='student')
# for admin and other roles permission


class AuditLog(models.Model):
    """
    Tracks security-related events and admin actions
    """
    ACTION_TYPES = [
        ('role_change', 'Role Change'),
        ('user_created', 'User Created'),
        ('user_modified', 'User Modified'),
        ('book_created', 'Book Created'),
        ('book_modified', 'Book Modified'),
        ('book_deleted', 'Book Deleted'),
        ('permission_denied', 'Permission Denied'),
        ('login', 'User Login'),
        ('logout', 'User Logout'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)  # Additional data

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.user.username if self.user else 'System'}: {self.action_type} at {self.timestamp}"


class Book(models.Model):
    cover_image = models.ImageField(
        upload_to='book_covers/', blank=True, null=True)
    GENRE_CHOICES = [
        # Academic Disciplines
        ('Sciences', 'Sciences'),
        ('Social Sciences', 'Social Sciences'),
        ('Humanities', 'Humanities'),
        ('Business & Economics', 'Business & Economics'),
        ('Law & Legal Studies', 'Law & Legal Studies'),
        # This is 29 characters
        ('Technology & Computer Science', 'Technology & Computer Science'),
        # This is 26 characters
        ('Medical & Health Sciences', 'Medical & Health Sciences'),
        ('Engineering', 'Engineering'),
        ('Education', 'Education'),
        ('Arts & Architecture', 'Arts & Architecture'),

        # Fiction Categories (for leisure reading)
        ('Mystery/Thriller', 'Mystery/Thriller'),
        ('Fantasy', 'Fantasy'),
        ('Science Fiction', 'Science Fiction'),
        ('Romance', 'Romance'),
        ('Historical Fiction', 'Historical Fiction'),
        ('Gothic Fiction', 'Gothic Fiction'),
        ('Epic / Mythology', 'Epic / Mythology'),
        ('Literary Fiction', 'Literary Fiction'),
        ('Existential Fiction', 'Existential Fiction'),
        ('Graphic Novels/Manga', 'Graphic Novels/Manga'),
        ('Satire/Adventure', 'Satire/Adventure'),
        ('Psychological Fiction', 'Psychological Fiction'),
        ('Coming-of-Age', 'Coming-of-Age'),
        ('Tragedy', 'Tragedy'),
        ('Horror', 'Horror'),
        ('Poetry', 'Poetry'),
        ('Epic Poetry', 'Epic Poetry'),

        # General Categories
        # This is 23 characters
        ('Biography/Autobiography', 'Biography/Autobiography'),
        ('History', 'History'),
        ('Philosophy', 'Philosophy'),
        ('Religion/Spirituality', 'Religion/Spirituality'),  # This is 22 characters
        ('Self-Help', 'Self-Help'),
        ('Travel', 'Travel'),
        ('Cookbooks', 'Cookbooks'),

        ('Other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=13, unique=True)
    # Changed from 20 to 30
    genre = models.CharField(max_length=30, choices=GENRE_CHOICES)
    publication_year = models.IntegerField()
    # ... rest of the fields remain the same
    description = models.TextField(blank=True, null=True)
    total_copies = models.IntegerField(default=1)
    available_copies = models.IntegerField(default=1)
    reserved_copies = models.IntegerField(default=0)
    cover_image = models.ImageField(
        upload_to='book_covers/', blank=True, null=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    is_academic = models.BooleanField(default=True)
    subject_code = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Set available copies for new books
        if not self.pk:
            self.available_copies = self.total_copies
            self.reserved_copies = 0

        # First save to get the ID (for new books)
        super().save(*args, **kwargs)

        # Generate QR code only if it doesn't exist and qrcode is available
        if qrcode and not self.qr_code:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(f"BOOK:{self.id}")
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            file_name = f'qr_{self.id}.png'

            # Save the QR code without triggering another save
            self.qr_code.save(file_name, File(buffer), save=False)

            # Update only the qr_code field to avoid recursion
            super().save(update_fields=['qr_code'])

    def generate_qr_code(self):
        if not self.pk:
            return

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(f"BOOK:{self.id}")
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')

        file_name = f'book_qr_{self.id}.png'
        self.qr_code.save(file_name, File(buffer), save=False)
        super().save(update_fields=['qr_code'])

    @property
    def get_cover_url(self, request=None):
        """Safe method to get cover image URL with fallback"""
        if self.cover_image and hasattr(self.cover_image, 'url'):
            if request:
                return request.build_absolute_uri(self.cover_image.url)
            return self.cover_image.url
        return None
    
    @property
    def get_safe_description(self):
        """Get description with fallback"""
        if self.description:
            return self.description
        return f"A book by {self.author} in the genre of {self.genre}."
    
    @property
    def qr_code_url(self):
        if self.qr_code and hasattr(self.qr_code, 'url'):
            return self.qr_code.url
        return None
    
    @property
    def effectively_available(self):
        """Books that can be reserved (available - reserved)"""
        return max(0, self.available_copies - self.reserved_copies)

    @property
    def can_be_reserved(self):
        """Check if book can be reserved"""
        return self.effectively_available > 0

# models.py - KEEP THIS (UserProfile model)
# models.py - KEEP THIS (it's correct)


class UserProfile(models.Model):
    USER_TYPES = (
        ('student', 'Student'),
        ('librarian', 'Librarian'),
        ('admin', 'Admin'),
        ('teacher', 'Teacher')  # Added teacher
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(
        max_length=10, choices=USER_TYPES, default='student')
    phone = models.CharField(max_length=15, blank=True)
    college_id = models.CharField(max_length=20, blank=True, null=True)
    # ADDED - unique for students
    roll_number = models.CharField(
        max_length=20, blank=True, null=True, unique=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    year_of_study = models.IntegerField(blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    borrowing_limit = models.IntegerField(default=5)
    borrowing_period = models.IntegerField(default=14)

    def __str__(self):
        return self.user.username


class Transaction(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    issue_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    return_date = models.DateTimeField(null=True, blank=True)
    fine_amount = models.DecimalField(
        max_digits=8, decimal_places=2, default=0.00)
    fine_paid = models.BooleanField(default=False)
    fine_paid_date = models.DateTimeField(null=True, blank=True)

    # QR System Fields
    qr_code = models.ImageField(
        upload_to='transaction_qr_codes/', blank=True, null=True)
    qr_data = models.TextField(null=True, blank=True)  # NEW: Base64 storage

    STATUS_CHOICES = [
        ('pending', 'Pending Pickup'),
        ('borrowed', 'Borrowed'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending')
    qr_generated_at = models.DateTimeField(auto_now_add=True)
    qr_expiry_hours = models.IntegerField(default=24)
    issued_at = models.DateTimeField(null=True, blank=True)

    def calculate_fine(self):
        """Calculate fine based on overdue days"""
        if self.return_date and not self.fine_paid:
            return_date = self.return_date.date()
            due_date = self.due_date.date()
            if return_date > due_date:
                days_overdue = (return_date - due_date).days
                fine_per_day = 5
                return days_overdue * fine_per_day
        return 0.00

    def is_qr_valid(self):
        """Check if QR is still valid"""
        if not self.qr_generated_at:
            return False
        expiry_time = self.qr_generated_at + \
            timedelta(hours=self.qr_expiry_hours)
        return timezone.now() <= expiry_time

    def get_qr_expiry_time(self):
        """Get when QR expires - FIXED"""
        if self.qr_generated_at:
            expiry = self.qr_generated_at + \
                timedelta(hours=self.qr_expiry_hours)
            return expiry
        return None

    def mark_as_issued(self):
        """Mark transaction as issued by librarian"""
        self.status = 'borrowed'
        self.issued_at = timezone.now()
        self.save()

    def save(self, *args, **kwargs):
        if self.return_date and not self.fine_paid:
            self.fine_amount = self.calculate_fine()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.book.title}"


class BookWaitlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    position = models.IntegerField()
    joined_at = models.DateTimeField(auto_now_add=True)
    notified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'book']
        ordering = ['position']

    def is_active(self):
        """Check if waitlist entry is still active (within claim window)"""
        if self.expires_at:
            return timezone.now() <= self.expires_at
        return True

    def __str__(self):
        return f"{self.user.username} - {self.book.title} (Position #{self.position})"


class PendingRegistration(models.Model):
    """
    Temporary storage for user registrations pending OTP verification.
    """
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        # Librarian and Admin are NOT choices here; they are created by admins.
    )

    # Prevents multiple registration attempts
    email = models.EmailField(unique=True)
    otp_code = models.CharField(max_length=6)  # The 6-digit code
    otp_created_at = models.DateTimeField(
        auto_now_add=True)  # Timestamp for expiry
    registration_data = models.JSONField()  # Stores all form data as a JSON blob
    # True only after OTP is correctly entered
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"Pending: {self.email}"

    def is_otp_expired(self):
        """Check if the OTP has expired (e.g., older than 10 minutes)."""
        expiry_time = self.otp_created_at + timedelta(minutes=10)
        return timezone.now() > expiry_time

    class Meta:
        # Optional: Clean up expired records automatically if needed
        pass


# Add to models.py
class ReturnRequest(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE)
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], default='pending')
    qr_code = models.ImageField(
        upload_to='return_qr_codes/', blank=True, null=True)

# Add to library/models.py


class PasswordResetToken(models.Model):
    """
    Secure password reset token system with expiration and usage tracking
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        """Check if token is still valid (not used and not expired)"""
        return not self.is_used and timezone.now() < self.expires_at

    def mark_as_used(self):
        """Mark token as used to prevent reuse"""
        self.is_used = True
        self.save()

    def __str__(self):
        return f"Password reset for {self.user.email} (expires: {self.expires_at})"

    class Meta:
        ordering = ['-created_at']  # Newest tokens first


class BookRating(models.Model):
    """
    Stores user ratings for books (1-5 stars)
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    rating = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'book']  # One rating per user per book
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} rated {self.book.title}: {self.rating} stars"


class BookReview(models.Model):
    """
    Stores user reviews with comments
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    review_text = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=True)  # For moderation

    class Meta:
        unique_together = ['user', 'book']  # One review per user per book
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.user.username} for {self.book.title}"

# Add this method to your existing Book model


def update_book_rating_stats(self):
    """
    Update average rating and rating count for a book
    """
    from django.db.models import Avg, Count
    stats = BookRating.objects.filter(book=self).aggregate(
        average_rating=Avg('rating'),
        rating_count=Count('id')
    )
    # We'll store these in the Book model or calculate on-demand
    return stats


# Add the method to Book class
Book.update_rating_stats = update_book_rating_stats


class ReadingGoalQuerySet(models.QuerySet):
    def active(self):
        """Return only currently active goals"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.filter(start_date__lte=today, end_date__gte=today)

    def completed(self):
        """Return goals that have already ended"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.filter(end_date__lt=today)


class ReadingGoal(models.Model):
    """
    Tracks user reading goals (e.g., books per month)
    """
    GOAL_TYPES = [
        ('books', 'Books Read'),
        ('pages', 'Pages Read'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    goal_type = models.CharField(
        max_length=10, choices=GOAL_TYPES, default='books')
    target = models.IntegerField()  # Target number (books or pages)
    period = models.CharField(
        max_length=20, default='monthly')  # monthly, yearly
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    objects = ReadingGoalQuerySet.as_manager()

    def progress(self):
        """Calculate current progress towards goal"""
        from django.utils import timezone
        from django.db.models import Count, Sum

        if self.goal_type == 'books':
            # Count books read during goal period
            completed = Transaction.objects.filter(
                user=self.user,
                return_date__isnull=False,
                return_date__range=[self.start_date, self.end_date]
            ).count()
        else:  # pages goal
            # Estimate pages (assuming 300 pages per book)
            completed = Transaction.objects.filter(
                user=self.user,
                return_date__isnull=False,
                return_date__range=[self.start_date, self.end_date]
            ).count() * 300

        return {
            'completed': completed,
            'target': self.target,
            'percentage': min(100, int((completed / self.target) * 100)) if self.target > 0 else 0
        }

    def is_active(self):
        """Check if goal is currently active"""
        from django.utils import timezone
        return self.start_date <= timezone.now().date() <= self.end_date

    class Meta:
        ordering = ['-created_at']


class Achievement(models.Model):
    """
    Pre-defined achievements/badges users can earn
    """
    ACHIEVEMENT_TYPES = [
        ('books_read', 'Books Read'),
        ('genres_explored', 'Genres Explored'),
        ('reading_streak', 'Reading Streak'),
        ('speed_reader', 'Speed Reader'),
        ('reviewer', 'Active Reviewer'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    achievement_type = models.CharField(
        max_length=20, choices=ACHIEVEMENT_TYPES)
    requirement = models.IntegerField()  # Number required to earn
    icon = models.CharField(
        max_length=50, default='fas fa-trophy')  # FontAwesome icon
    # Bootstrap color class
    color = models.CharField(max_length=20, default='warning')

    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    """
    Tracks which achievements users have earned
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    # Current progress if not completed
    progress = models.IntegerField(default=0)

    class Meta:
        unique_together = ['user', 'achievement']
        ordering = ['-earned_at']

    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"


class ReadingSession(models.Model):
    """
    Optional: Track reading sessions for more accurate statistics
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    pages_read = models.IntegerField(default=0)

    class Meta:
        ordering = ['-start_time']

# Add these methods to the User model (we'll use signals to create user stats)


def get_user_reading_stats(self):
    """
    Calculate comprehensive reading statistics for a user
    """
    from django.db.models import Count, Max, Min
    from django.utils import timezone

    # 📚 Transactions
    transactions = Transaction.objects.filter(user=self)
    returned_books = transactions.filter(return_date__isnull=False)

    # ✅ Basic stats
    total_books_read = returned_books.count()
    estimated_pages = total_books_read * 300

    # 🔥 Reading streak
    streak = self._calculate_reading_streak()

    # 🎭 Favorite genres
    favorite_genres = (
        returned_books.values('book__genre')
        .annotate(count=Count('id'))
        .order_by('-count')[:3]
    )

    # ⏳ Monthly pace
    monthly_pace = self._calculate_reading_pace()

    # 🎯 Goals - FIXED
    today = timezone.now().date()
    active_goals = ReadingGoal.objects.filter(
        user=self,
        start_date__lte=today,
        end_date__gte=today
    )
    completed_goals = ReadingGoal.objects.filter(
        user=self,
        end_date__lt=today
    )

    # 🏆 Earned achievements
    earned_achievements = UserAchievement.objects.filter(user=self)

    return {
        'total_books_read': total_books_read,
        'estimated_pages_read': estimated_pages,
        'current_streak': streak,
        'favorite_genres': list(favorite_genres),
        'monthly_pace': monthly_pace,
        'active_goals': [goal.progress() for goal in active_goals],
        'completed_goals': [goal.progress() for goal in completed_goals],
        'achievements_earned': earned_achievements.count(),
        'first_book_date': returned_books.aggregate(Min('return_date'))['return_date__min'],
        'last_book_date': returned_books.aggregate(Max('return_date'))['return_date__max'],
    }


def _calculate_reading_streak(self):
    """
    Calculate consecutive days with reading activity
    """
    from django.utils import timezone
    from datetime import timedelta

    # Get unique dates when user returned books
    reading_dates = Transaction.objects.filter(
        user=self,
        return_date__isnull=False
    ).dates('return_date', 'day').order_by('-return_date')

    if not reading_dates:
        return 0

    streak = 1
    current_date = timezone.now().date()

    # Check if read today or yesterday to start streak
    if reading_dates[0] == current_date:
        # Read today, start counting from today
        check_date = current_date
    elif reading_dates[0] == current_date - timedelta(days=1):
        # Read yesterday, start counting from yesterday
        check_date = current_date - timedelta(days=1)
        streak = 1
    else:
        # No recent reading, no streak
        return 0

    # Count consecutive days
    for i in range(1, len(reading_dates)):
        if reading_dates[i] == check_date - timedelta(days=1):
            streak += 1
            check_date = reading_dates[i]
        else:
            break

    return streak


def _calculate_reading_pace(self):
    """
    Calculate average books read per month
    """
    from django.db.models import Count
    from django.utils import timezone
    from datetime import timedelta

    # Books read in last 3 months for pace calculation
    three_months_ago = timezone.now() - timedelta(days=90)
    recent_books = Transaction.objects.filter(
        user=self,
        return_date__isnull=False,
        return_date__gte=three_months_ago
    ).count()

    return round(recent_books / 3, 1)  # Average per month


# Add the method to User model
User.add_to_class('get_reading_stats', get_user_reading_stats)
User.add_to_class('_calculate_reading_streak', _calculate_reading_streak)
User.add_to_class('_calculate_reading_pace', _calculate_reading_pace)


# Add to models.py - Notification System Models to notify the users

class Notification(models.Model):
    """
    System to notify users about library activities
    """
    NOTIFICATION_TYPES = [
        ('due_reminder', 'Due Date Reminder'),
        ('overdue', 'Overdue Book'),
        ('fine', 'Fine Applied'),
        ('achievement', 'Achievement Earned'),
        ('book_available', 'Book Available'),
        ('system', 'System Notification'),
        ('welcome', 'Welcome Message'),
        ('reservation_confirmation', 'Reservation Confirmed'),
        ('reservation_ready', 'Reservation Ready'),
        ('reservation_expiring', 'Reservation Expiring Soon'),
        ('pickup_reminder', 'Pickup Reminder'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notification_type = models.CharField(
        max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_book = models.ForeignKey(
        Book, on_delete=models.CASCADE, null=True, blank=True)
    related_transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, null=True, blank=True)
    action_url = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title}"


# In models.py - Add these fields to UserNotificationPreference model
class UserNotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # NEW RESERVATION PREFERENCES
    email_reservation_confirmation = models.BooleanField(default=True)
    email_reservation_ready = models.BooleanField(default=True)
    email_reservation_expiring = models.BooleanField(default=True)
    email_pickup_reminder = models.BooleanField(default=True)
    push_reservation_confirmation = models.BooleanField(default=True)
    push_reservation_ready = models.BooleanField(default=True)
    push_reservation_expiring = models.BooleanField(default=True)
    push_pickup_reminder = models.BooleanField(default=True)
    
    # EXISTING PREFERENCES
    email_due_reminders = models.BooleanField(default=True)
    email_overdue_alerts = models.BooleanField(default=True)
    email_fine_notifications = models.BooleanField(default=True)
    email_achievements = models.BooleanField(default=True)
    email_book_available = models.BooleanField(default=True)
    push_due_reminders = models.BooleanField(default=True)
    push_overdue_alerts = models.BooleanField(default=True)

    def __str__(self):
        return f"Notification preferences for {self.user.username}"