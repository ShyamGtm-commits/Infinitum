# In library/admin.py - UPDATE with Notification models
from django.contrib import admin
from .models import (
    Book, UserProfile, Transaction, PendingRegistration,
    PasswordResetToken, BookRating, BookReview, ReadingGoal,
    UserAchievement, Achievement, Notification, UserNotificationPreference
)

# Register all models
admin.site.register(Book)
admin.site.register(UserProfile)
admin.site.register(Transaction)
admin.site.register(PendingRegistration)
admin.site.register(PasswordResetToken)
admin.site.register(BookRating)
admin.site.register(BookReview)
admin.site.register(ReadingGoal)
admin.site.register(UserAchievement)
admin.site.register(Achievement)
admin.site.register(Notification)
admin.site.register(UserNotificationPreference)