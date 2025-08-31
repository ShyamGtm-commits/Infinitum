from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Book, UserProfile, Transaction


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'user_type', 'phone']


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'
