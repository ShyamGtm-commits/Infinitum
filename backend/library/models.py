from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, timedelta
import qrcode
from io import BytesIO
from django.core.files import File
import os
# backend/library/models.py  (append)
from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_save


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    is_librarian = models.BooleanField(default=False)
    phone = models.CharField(max_length=30, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return f"Profile({self.user.username})"


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_or_update_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        # if profile exists, save it, otherwise create one
        Profile.objects.get_or_create(user=instance)


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
        ('Graphic Novels/Manga', 'Graphic Novels/Manga'),

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
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):

        if not self.pk:  # New book being created
            self.available_copies = self.total_copies
        super().save(*args, **kwargs)

        # Generate QR code if not exists
        if not self.qr_code:
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

            self.qr_code.save(file_name, File(buffer), save=False)

        super().save(*args, **kwargs)


class UserProfile(models.Model):
    USER_TYPES = (
        ('student', 'Student'),
        ('librarian', 'Librarian'),
        ('admin', 'Admin'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(
        max_length=10, choices=USER_TYPES, default='student')
    phone = models.CharField(max_length=15, blank=True)

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
    fine_paid = models.BooleanField(default=False)  # Track if fine is paid
    fine_paid_date = models.DateTimeField(
        null=True, blank=True)  # When fine was paid

    def calculate_fine(self):
        """Calculate fine based on overdue days"""
        if self.return_date and not self.fine_paid:
            return_date = self.return_date.date()
            due_date = self.due_date.date()

            if return_date > due_date:
                days_overdue = (return_date - due_date).days
                fine_per_day = 5  # ₹5 per day
                return days_overdue * fine_per_day
        return 0.00

    def save(self, *args, **kwargs):
        # Auto-calculate fine if book is returned
        if self.return_date and not self.fine_paid:
            self.fine_amount = self.calculate_fine()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.book.title}"
