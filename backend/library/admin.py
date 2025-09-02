from django.contrib import admin
from .models import Book, UserProfile, Transaction

admin.site.register(Book)
admin.site.register(UserProfile)
admin.site.register(Transaction)

