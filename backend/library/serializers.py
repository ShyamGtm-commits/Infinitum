from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Book, UserProfile, Transaction, BookRating, BookReview, 
    ReadingGoal, UserAchievement, Achievement, Notification, 
    UserNotificationPreference
)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'user_type', 'phone',
                  'college_id', 'department', 'year_of_study',
                  'designation', 'borrowing_limit', 'borrowing_period']


class BookSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    # ✅ ADD these new fields for reservation system
    effectively_available = serializers.ReadOnlyField()
    can_be_reserved = serializers.ReadOnlyField()
    reserved_copies = serializers.IntegerField(read_only=True)

    class Meta:
        model = Book
        fields = '__all__'
        

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            # Return full URL if available
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None

    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            return obj.qr_code.url
        return None

    # ✅ OPTIONAL: Add validation to ensure reserved_copies doesn't exceed available_copies
    def validate(self, data):
        """
        Validate that reserved_copies doesn't exceed available_copies
        """
        reserved_copies = data.get('reserved_copies', self.instance.reserved_copies if self.instance else 0)
        available_copies = data.get('available_copies', self.instance.available_copies if self.instance else 0)
        
        if reserved_copies > available_copies:
            raise serializers.ValidationError({
                'reserved_copies': 'Reserved copies cannot exceed available copies'
            })
        
        return data


class TransactionSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'

# serializers.py - Add this custom serializer


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    # User fields that users can edit
    first_name = serializers.CharField(
        source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.CharField(source='user.email', required=False)

    # Profile fields users can edit
    phone = serializers.CharField(required=False)

    class Meta:
        model = UserProfile
        fields = ['phone', 'first_name', 'last_name',
                  'email']  # Only editable fields

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Update user fields
        for attr, value in user_data.items():
            setattr(user, attr, value)

        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        user.save()
        instance.save()
        return instance


class AdminUserProfileSerializer(serializers.ModelSerializer):
    # Admins can see all fields but only edit some
    username = serializers.CharField(
        source='user.username', read_only=True)  # Read-only
    first_name = serializers.CharField(
        source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.CharField(source='user.email', required=False)

    class Meta:
        model = UserProfile
        fields = ['user_type', 'phone', 'username',
                  'first_name', 'last_name', 'email']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Update user fields
        for attr, value in user_data.items():
            setattr(user, attr, value)

        # Update profile fields (including user_type - only admins can change this)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        user.save()
        instance.save()
        return instance


class BookRatingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = BookRating
        fields = ['id', 'user', 'user_name', 'book', 'rating', 'created_at']
        read_only_fields = ['user', 'created_at']


class BookReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = BookReview
        fields = ['id', 'user', 'user_name', 'book', 'book_title',
                  'review_text', 'created_at', 'updated_at', 'is_approved']
        read_only_fields = ['user', 'created_at', 'updated_at']

# Enhance the existing BookSerializer to include rating info
# REPLACE your existing BookSerializer with this enhanced version:


class BookSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    # ✅ ADD these new fields for reservation system
    effectively_available = serializers.ReadOnlyField()
    can_be_reserved = serializers.ReadOnlyField()
    reserved_copies = serializers.IntegerField(read_only=True)

    class Meta:
        model = Book
        fields = '__all__'

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None

    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            return obj.qr_code.url
        return None

    def get_average_rating(self, obj):
        """Calculate average rating for the book - FIXED to always return a number"""
        from django.db.models import Avg
        result = BookRating.objects.filter(book=obj).aggregate(Avg('rating'))
        avg_rating = result['rating__avg'] or 0
        return round(avg_rating, 1)  # Always return a number, never None

    def get_rating_count(self, obj):
        """Get total number of ratings - FIXED to always return a number"""
        count = BookRating.objects.filter(book=obj).count()
        return count  # Always return a number, never None

    def get_user_rating(self, obj):
        """Get current user's rating for this book"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rating = BookRating.objects.get(book=obj, user=request.user)
                return rating.rating
            except BookRating.DoesNotExist:
                return None
        return None


