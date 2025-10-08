from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.db import transaction
from django.db import IntegrityError
from django.db.models import Q, Count, Sum, Avg, F, Case, When, Value, IntegerField, Max
from datetime import datetime, timedelta
from django.utils import timezone
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.utils.timesince import timesince
from django.core.cache import cache
import re
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
from collections import defaultdict
import logging
import weasyprint

# Local imports - COMBINED into ONE import statement
from .models import (
    Book, UserProfile, Transaction, PendingRegistration, 
    PasswordResetToken, BookRating, BookReview, ReadingGoal, 
    UserAchievement, Achievement, Notification, UserNotificationPreference
)
from .serializers import (
    BookSerializer, UserSerializer, UserProfileSerializer, 
    TransactionSerializer, BookRatingSerializer, BookReviewSerializer
)
from .utils import generate_otp, send_otp_email
from .password_reset_utils import create_password_reset_token, send_password_reset_email
from .notification_utils import NotificationManager

logger = logging.getLogger(__name__)

# library/views.py

# --- General API Endpoints ---


@api_view(['GET'])
@permission_classes([AllowAny])
def api_status(request):
    """
    Checks the status of the API.
    """
    return Response({"status": "API is working!"})


@api_view(['GET'])
def get_csrf_token(request):
    """
    Returns a CSRF token.
    """
    return Response({'detail': 'CSRF cookie set'})


@api_view(['GET'])
@permission_classes([AllowAny])
def book_list(request):
    books = Book.objects.all()
    serializer = BookSerializer(books, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def book_detail(request, book_id):
    try:
        book = Book.objects.get(id=book_id)
        serializer = BookSerializer(book, context={'request': request})
        return Response(serializer.data)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_books(request):
    """
    Searches for books with multiple filters: title, author, genre, year range, and availability.
    """
    query = request.GET.get('q', '')
    genre = request.GET.get('genre', '')
    author = request.GET.get('author', '')
    year_from = request.GET.get('year_from', '')
    year_to = request.GET.get('year_to', '')
    available_only = request.GET.get(
        'available_only', 'false').lower() == 'true'

    books = Book.objects.all()

    if query:
        books = books.filter(
            Q(title__icontains=query) |
            Q(author__icontains=query) |
            Q(description__icontains=query)
        )
    if genre:
        books = books.filter(genre=genre)
    if author:
        books = books.filter(author__icontains=author)
    if year_from:
        books = books.filter(publication_year__gte=year_from)
    if year_to:
        books = books.filter(publication_year__lte=year_to)
    if available_only:
        books = books.filter(available_copies__gt=0)

    books = books.order_by('title')
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)

# --- Authentication Endpoints ---


# @api_view(['POST'])
# @permission_classes([AllowAny])
# def register_user(request):
#     """
#     Registers a new user with a specified username, password, email, and user type.
#     """
#     try:
#         username = request.data.get('username')
#         password = request.data.get('password')
#         email = request.data.get('email')
#         user_type = request.data.get('user_type', 'student')
#         roll_number = request.data.get('roll_number', '')  # ADDED

#         # Check if username exists FIRST
#         if User.objects.filter(username=username).exists():
#             return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

#         # Check if roll number already exists for students
#         if user_type == 'student' and roll_number:
#             if UserProfile.objects.filter(roll_number=roll_number).exists():
#                 return Response({'error': 'Roll number already registered'}, status=status.HTTP_400_BAD_REQUEST)

#         # Create the User FIRST
#         user = User.objects.create_user(
#             username=username,
#             password=password,
#             email=email,
#             first_name=request.data.get('first_name', ''),
#             last_name=request.data.get('last_name', '')
#         )

#         # Set borrowing limits based on user type
#         borrowing_limit = 5  # Default for students
#         borrowing_period = 14  # Default 2 weeks

#         if user_type == 'teacher':
#             borrowing_limit = 10
#             borrowing_period = 28
#         elif user_type == 'librarian':
#             borrowing_limit = 15
#             borrowing_period = 35
#         elif user_type == 'admin':
#             borrowing_limit = 20
#             borrowing_period = 42

#         # NOW create UserProfile with additional fields
#         profile = UserProfile.objects.create(
#             user=user,
#             user_type=user_type,
#             phone=request.data.get('phone', ''),
#             college_id=request.data.get('college_id', ''),
#             roll_number=roll_number,  # ADDED
#             department=request.data.get('department', ''),
#             year_of_study=request.data.get('year_of_study'),
#             designation=request.data.get('designation', ''),
#             borrowing_limit=borrowing_limit,
#             borrowing_period=borrowing_period
#         )

#         return Response({
#             'success': 'User created successfully',
#             'user_id': user.id,
#             'username': user.username,
#             'roll_number': roll_number  # ADDED
#         }, status=status.HTTP_201_CREATED)

#     except Exception as e:
#         # Clean up if user was created but profile failed
#         if 'user' in locals():
#             user.delete()
#         return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """
    Authenticates a user and logs them in.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    print(f"🔍 Login attempt: {username}")

    # Try authenticating with username OR email
    user = authenticate(request, username=username, password=password)

    # If username auth fails, try email auth
    if user is None and '@' in username:
        try:
            user_obj = User.objects.get(email=username)
            user = authenticate(
                request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass

    if user is not None:
        login(request, user)
        user_profile = UserProfile.objects.get(user=user)
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user_profile.user_type
        }
        print(f"🔍 Login successful: {user.username}")
        return Response({'success': 'Login successful', 'user': user_data})
    else:
        print(f"🔍 Login failed for: {username}")
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_user(request):
    """
    Logs out the current user.
    """
    logout(request)
    return Response({'success': 'Logout successful'})

# --- User Endpoints ---


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Retrieves or updates the authenticated user's profile.
    """
    try:
        profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    elif request.method == 'PUT':
        if profile.user != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = UserProfileSerializer(
            profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_reading_history(request):
    """
    Retrieves the reading history (all transactions) for the authenticated user.
    """
    transactions = Transaction.objects.filter(
        user=request.user
    ).select_related('book').order_by('-issue_date')

    reading_history = []
    for transaction in transactions:
        reading_history.append({
            'book': BookSerializer(transaction.book).data,
            'issue_date': transaction.issue_date,
            'return_date': transaction.return_date,
            'status': 'Returned' if transaction.return_date else 'Borrowed'
        })
    return Response(reading_history)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_transactions(request):
    """
    Retrieves all transactions for the current user.
    """
    transactions = Transaction.objects.filter(
        user=request.user
    ).select_related('book').order_by('-issue_date')
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_active_borrows(request):
    """
    Retrieves active (not yet returned) borrows for the current user.
    """
    transactions = Transaction.objects.filter(
        user=request.user,
        return_date__isnull=True
    ).select_related('book').order_by('due_date')
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def borrow_book(request, book_id):
    """
    Allows an authenticated user to borrow a book with confirmation.
    """
    try:
        # Check if this is a confirmation request
        confirmation = request.data.get('confirmation', False)

        # If not confirmed, return confirmation required message
        if not confirmation:
            book = Book.objects.get(id=book_id)

            # Get book details for confirmation message
            book_details = {
                'title': book.title,
                'author': book.author,
                'due_date': (timezone.now() + timedelta(weeks=2)).strftime('%Y-%m-%d')
            }

            return Response({
                'requires_confirmation': True,
                'message': f'Do you want to borrow "{book.title}" by {book.author}?',
                'book_details': book_details
            }, status=status.HTTP_200_OK)

        # If confirmed, proceed with borrowing
        user_profile = UserProfile.objects.get(user=request.user)
        book = Book.objects.get(id=book_id)

        # Check 1: Available copies
        if book.available_copies <= 0:
            return Response({'error': 'No copies available'}, status=status.HTTP_400_BAD_REQUEST)

        # Check 2: Already borrowed this book
        existing_transaction = Transaction.objects.filter(
            book=book,
            user=request.user,
            return_date__isnull=True
        ).exists()
        if existing_transaction:
            return Response({
                'error': 'You have already borrowed this book. Please return it before borrowing again.',
                'already_borrowed': True  # ⭐ Add this flag
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check 3: Borrowing limit reached
        current_borrows = Transaction.objects.filter(
            user=request.user,
            return_date__isnull=True
        ).count()

        if current_borrows >= user_profile.borrowing_limit:
            return Response({
                'error': f'Borrowing limit reached. You can only borrow {user_profile.borrowing_limit} books at a time.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check 4: Outstanding fines
        unpaid_fines = Transaction.objects.filter(
            user=request.user,
            fine_amount__gt=0,
            fine_paid=False
        ).aggregate(Sum('fine_amount'))['fine_amount__sum'] or 0

        if unpaid_fines > 0:
            return Response({
                'error': f'You have outstanding fines of ₹{unpaid_fines}. Please pay before borrowing more books.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate due date based on user type
        due_date = timezone.now() + timedelta(days=user_profile.borrowing_period)

        # Create transaction
        transaction = Transaction.objects.create(
            book=book,
            user=request.user,
            due_date=due_date
        )

        # Update available copies
        book.available_copies -= 1
        book.save()

         # ✅ OPTIONAL: Check for "first book borrowed" type achievements
        try:
            from .reading_utils import check_and_award_achievements
            awarded = check_and_award_achievements(request.user)
            if awarded:
                print(f"🎉 Achievements after borrow: {awarded}")
        except Exception as e:
            logger.error(f"Error in achievement check after borrow: {e}")
            

        serializer = TransactionSerializer(transaction)
        return Response({
            'success': 'Book borrowed successfully!',
            'due_date': due_date.strftime('%Y-%m-%d'),
            'borrowing_period_days': user_profile.borrowing_period,
            'transaction': serializer.data
        }, status=status.HTTP_201_CREATED)

    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def return_book(request, transaction_id):
    """
    Allows an authenticated user to return a borrowed book. Calculates fines if overdue.
    """
    try:
        transaction = Transaction.objects.get(
            id=transaction_id,
            user=request.user
        )
        if transaction.return_date:
            return Response({'error': 'Book already returned'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        due_date = transaction.due_date.date()

        if today > due_date:
            days_overdue = (today - due_date).days
            fine_per_day = 5  # ₹5 per day fine
            transaction.fine_amount = days_overdue * fine_per_day
        else:
            transaction.fine_amount = 0.00

        transaction.return_date = timezone.now()
        transaction.save()

        book = transaction.book
        book.available_copies += 1
        book.save()

        # ✅ ADD THIS: Automatically check achievements after book return
        try:
            from .reading_utils import check_achievements_on_book_return
            awarded_achievements = check_achievements_on_book_return(request.user, book)
            if awarded_achievements:
                print(f"🎉 Auto-awarded achievements for {request.user.username}: {awarded_achievements}")
        except Exception as e:
            logger.error(f"Error in achievement check after return: {e}")

        serializer = TransactionSerializer(transaction)
        return Response({'success': 'Book returned successfully', 'transaction': serializer.data})
    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_fines(request):
    """
    Retrieves all fines for the current user, including total outstanding and paid amounts.
    """
    transactions = Transaction.objects.filter(
        user=request.user,
        fine_amount__gt=0
    ).order_by('-due_date')

    total_fines = sum(t.fine_amount for t in transactions if not t.fine_paid)
    total_paid = sum(t.fine_amount for t in transactions if t.fine_paid)

    serializer = TransactionSerializer(transactions, many=True)
    return Response({
        'transactions': serializer.data,
        'total_fines': total_fines,
        'total_paid': total_paid
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_fine(request, transaction_id):
    """
    Marks a specific fine as paid for the authenticated user.
    """
    try:
        transaction = Transaction.objects.get(
            id=transaction_id, user=request.user)

        if transaction.fine_paid:
            return Response({'error': 'Fine already paid'}, status=status.HTTP_400_BAD_REQUEST)
        if transaction.fine_amount <= 0:
            return Response({'error': 'No fine to pay'}, status=status.HTTP_400_BAD_REQUEST)

        transaction.fine_paid = True
        transaction.fine_paid_date = timezone.now()
        transaction.save()

        serializer = TransactionSerializer(transaction)
        return Response({
            'success': f'Fine of ₹{transaction.fine_amount} paid successfully',
            'transaction': serializer.data
        })
    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_all_fines(request):
    """
    Marks all outstanding fines as paid for the authenticated user.
    """
    try:
        unpaid_fines = Transaction.objects.filter(
            user=request.user,
            fine_amount__gt=0,
            fine_paid=False
        )
        if not unpaid_fines.exists():
            return Response({'error': 'No outstanding fines'}, status=status.HTTP_400_BAD_REQUEST)

        total_amount = sum(fine.fine_amount for fine in unpaid_fines)
        unpaid_fines.update(fine_paid=True, fine_paid_date=timezone.now())

        return Response({
            'success': f'All fines totaling ₹{total_amount} paid successfully',
            'total_paid': total_amount
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- Recommendation Helper Functions ---

def get_popular_books_queryset(borrowed_book_ids, limit=10):
    """Get popular books excluding those already borrowed - helper function"""
    borrowed_ids_list = list(borrowed_book_ids)

    return Book.objects.filter(
        available_copies__gt=0
    ).exclude(
        id__in=borrowed_ids_list
    ).annotate(
        borrow_count=Count('transaction')
    ).order_by('-borrow_count')[:limit]

def get_enhanced_user_preferences(user):
    """
    More sophisticated user preference analysis with weighted scores
    """
    transactions = Transaction.objects.filter(user=user).select_related('book')
    
    if not transactions.exists():
        return {'genres': {}, 'authors': {}, 'recent_genres': set()}
    
    preferences = {
        'genres': defaultdict(int),
        'authors': defaultdict(int),
        'recent_genres': set()
    }
    
    # Recent transactions (last 30 days) get higher weight
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    for transaction in transactions:
        book = transaction.book
        # Higher weight for recent books
        weight = 3 if transaction.issue_date >= thirty_days_ago else 1
        
        preferences['genres'][book.genre] += weight
        preferences['authors'][book.author] += weight
        
        if transaction.issue_date >= thirty_days_ago:
            preferences['recent_genres'].add(book.genre)
    
    # Convert to relative scores (0-1)
    if preferences['genres']:
        max_genre = max(preferences['genres'].values())
        preferences['genres'] = {k: v/max_genre for k, v in preferences['genres'].items()}
    
    if preferences['authors']:
        max_author = max(preferences['authors'].values())
        preferences['authors'] = {k: v/max_author for k, v in preferences['authors'].items()}
    
    print(f"📊 User {user.username} preferences: {dict(preferences['genres'])}")
    return preferences

def get_enhanced_content_based_recommendations(user, borrowed_book_ids, limit=8):
    """
    Enhanced content-based filtering with multiple similarity factors
    """
    user_preferences = get_enhanced_user_preferences(user)
    
    if not user_preferences['genres'] and not user_preferences['authors']:
        return get_popular_books_queryset(borrowed_book_ids, limit)
    
    # Get all available books excluding borrowed ones
    books = Book.objects.filter(available_copies__gt=0).exclude(id__in=borrowed_book_ids)
    
    scored_books = []
    for book in books:
        score = 0
        
        # Genre matching (highest weight)
        genre_score = user_preferences['genres'].get(book.genre, 0)
        score += 3 * genre_score
        
        # Author matching (medium weight)
        author_score = user_preferences['authors'].get(book.author, 0)
        score += 2 * author_score
        
        # Recent interest boost
        if book.genre in user_preferences['recent_genres']:
            score += 1.5
        
        # Popularity boost (low weight)
        borrow_count = Transaction.objects.filter(book=book).count()
        score += 0.1 * min(borrow_count, 20)  # Cap at 20
        
        # Only include books with some relevance
        if score > 0:
            scored_books.append((book, score))
    
    # Sort by score and return top books
    scored_books.sort(key=lambda x: x[1], reverse=True)
    result = [book for book, score in scored_books[:limit]]
    
    print(f"🎯 Content-based recommendations: {len(result)} books with scores {[score for _, score in scored_books[:3]]}")
    return result

def get_enhanced_collaborative_recommendations(user, borrowed_book_ids, limit=5):
    """
    Improved collaborative filtering using multiple factors
    """
    user_prefs = get_enhanced_user_preferences(user)
    user_genres = set(user_prefs['genres'].keys())
    
    if not user_genres:
        return Book.objects.none()
    
    # Find users with substantial overlap
    similar_users = User.objects.filter(
        transaction__book__genre__in=user_genres
    ).exclude(id=user.id).annotate(
        common_genres=Count('transaction__book__genre', 
                          filter=Q(transaction__book__genre__in=user_genres)),
        total_books=Count('transaction')
    ).filter(
        common_genres__gte=1,  # At least 1 genre in common
        total_books__gte=2     # At least 2 books read
    ).order_by('-common_genres')[:8]  # Get top 8 similar users
    
    if not similar_users:
        return Book.objects.none()
    
    # Get books borrowed by similar users
    recommended_books = Book.objects.filter(
        transaction__user__in=similar_users,
        available_copies__gt=0
    ).exclude(
        id__in=borrowed_book_ids
    ).annotate(
        borrow_count=Count('transaction'),
        similar_user_count=Count('transaction__user', distinct=True)
    ).order_by('-similar_user_count', '-borrow_count')[:limit]
    
    print(f"👥 Collaborative recommendations: {recommended_books.count()} from {len(similar_users)} similar users")
    return recommended_books

def get_cached_recommendations(user, borrowed_book_ids):
    """
    Cache recommendations for 1 hour to improve performance
    """
    cache_key = f"user_{user.id}_recommendations"
    cached_recommendations = cache.get(cache_key)
    
    if cached_recommendations is not None:
        print(f"🎯 Using cached recommendations for user {user.username}")
        return cached_recommendations
    
    print(f"🔍 Generating fresh recommendations for user {user.username}")
    
    # Generate fresh recommendations using your existing functions
    content_based = get_enhanced_content_based_recommendations(user, borrowed_book_ids)
    collaborative = get_enhanced_collaborative_recommendations(user, borrowed_book_ids)
    
    # Combine and deduplicate
    all_recommendations = list(content_based)
    seen_ids = set(book.id for book in all_recommendations)
    
    for book in collaborative:
        if book.id not in seen_ids and len(all_recommendations) < 10:
            all_recommendations.append(book)
            seen_ids.add(book.id)
    
    # If still not enough, add popular books
    if len(all_recommendations) < 10:
        popular_books = get_popular_books_queryset(borrowed_book_ids)
        for book in popular_books:
            if book.id not in seen_ids and len(all_recommendations) < 10:
                all_recommendations.append(book)
                seen_ids.add(book.id)
    
    # Cache for 1 hour
    cache.set(cache_key, all_recommendations, 3600)
    return all_recommendations

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommendation_insights(request):
    """Provide insights about why books are recommended"""
    try:
        user_prefs = get_enhanced_user_preferences(request.user)
        
        top_genres = sorted(user_prefs['genres'].items(), key=lambda x: x[1], reverse=True)[:3]
        top_authors = sorted(user_prefs['authors'].items(), key=lambda x: x[1], reverse=True)[:2]
        
        # Determine reading level
        genre_count = len(user_prefs['genres'])
        if genre_count == 0:
            reading_level = "new-reader"
        elif genre_count < 3:
            reading_level = "genre-explorer"
        else:
            reading_level = "diverse-reader"
        
        return Response({
            'success': True,
            'user_insights': {
                'top_genres': [{'name': g, 'score': round(s, 2)} for g, s in top_genres],
                'top_authors': [{'name': a, 'score': round(s, 2)} for a, s in top_authors],
                'recent_interest_genres': list(user_prefs['recent_genres']),
                'reading_level': reading_level,
                'total_genres_explored': genre_count
            }
        })
        
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        return Response({'success': False, 'error': 'Could not generate insights'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_recommendations(request):
    """Enhanced context-based book recommendations with caching"""
    try:
        # Get user's borrowing history
        user_transactions = Transaction.objects.filter(user=request.user)
        borrowed_book_ids = list(user_transactions.values_list('book_id', flat=True))

        # If user has no borrowing history, return popular books
        if not user_transactions.exists():
            popular_books = get_popular_books_queryset(borrowed_book_ids)
            serializer = BookSerializer(popular_books, many=True, context={'request': request})
            return Response({
                'success': True,
                'recommendations': serializer.data,
                'strategy': 'popular',
                'total_recommendations': len(popular_books),
                'message': 'Popular books based on overall borrowing trends'
            })

        # Use cached recommendations
        all_recommendations = get_cached_recommendations(request.user, borrowed_book_ids)
        
        # Get recommendation strategy info
        strategy = "enhanced-hybrid"
        if len(all_recommendations) == 0:
            all_recommendations = get_popular_books_queryset(borrowed_book_ids)
            strategy = "fallback-popular"

        serializer = BookSerializer(all_recommendations, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'recommendations': serializer.data,
            'strategy': strategy,
            'total_recommendations': len(all_recommendations),
            'message': 'Personalized recommendations based on your reading preferences'
        })
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        # Fallback to popular books
        fallback_books = get_popular_books_queryset([], limit=10)
        serializer = BookSerializer(fallback_books, many=True, context={'request': request})
        return Response({
            'success': False,
            'recommendations': serializer.data,
            'strategy': 'error-fallback',
            'total_recommendations': len(fallback_books),
            'error': 'Using popular books as fallback'
        })

# --- Admin/Librarian Endpoints ---


def _check_admin_or_librarian_permission(request):
    """Helper function to check if the user is an admin or librarian."""
    user_profile = UserProfile.objects.get(user=request.user)
    if user_profile.user_type not in ['admin', 'librarian'] and not request.user.is_staff:
        return False
    return True


def _check_admin_permission(request):
    """Helper function to check if the user is an admin."""
    try:
        user_profile = UserProfile.objects.get(user=request.user)
        return user_profile.user_type == 'admin' or request.user.is_staff
    except UserProfile.DoesNotExist:
        # Create a profile for the user if it doesn't exist
        UserProfile.objects.create(user=request.user, user_type='student')
        return False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def admin_add_book(request):
    """
    Allows an admin to add a new book to the library.
    Handles file uploads for cover images.
    """
    print("Request data:", request.data)
    print("Request FILES:", request.FILES)
    if not _check_admin_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        data = request.data.copy()

        # Handle file upload
        if 'cover_image' in request.FILES:
            data['cover_image'] = request.FILES['cover_image']

        serializer = BookSerializer(data=data)

        if serializer.is_valid():
            book = serializer.save()
            return Response({
                'success': 'Book added successfully!',
                'book': BookSerializer(book).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': 'Server error',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_book(request, book_id):
    """
    Allows an admin to delete a book from the library.
    """
    if not _check_admin_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        book = Book.objects.get(id=book_id)
        book.delete()
        return Response({'success': 'Book deleted successfully'})
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def librarian_active_transactions(request):
    """
    Allows librarians/admins to view all active (not yet returned) transactions.
    """
    if not _check_admin_or_librarian_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    transactions = Transaction.objects.filter(
        return_date__isnull=True
    ).select_related('book', 'user').order_by('due_date')

    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def librarian_manual_issue(request):
    """
    Allows librarians/admins to manually issue a book to a user.
    """
    if not _check_admin_or_librarian_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    book_id = request.data.get('book_id')
    username = request.data.get('username')

    try:
        book = Book.objects.get(id=book_id)
        user = User.objects.get(username=username)

        if book.available_copies <= 0:
            return Response({'error': 'No copies available'}, status=status.HTTP_400_BAD_REQUEST)

        transaction = Transaction.objects.create(
            book=book,
            user=user,
            due_date=timezone.now() + timedelta(weeks=2)
        )
        book.available_copies -= 1
        book.save()

        serializer = TransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def librarian_manual_return(request, transaction_id):
    """
    Allows librarians/admins to manually return a book. Calculates fines if overdue.
    """
    if not _check_admin_or_librarian_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        transaction = Transaction.objects.get(id=transaction_id)
        if transaction.return_date:
            return Response({'error': 'Book already returned'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        due_date = transaction.due_date.date()

        if today > due_date:
            days_overdue = (today - due_date).days
            fine_per_day = 5  # ₹5 per day fine
            transaction.fine_amount = days_overdue * fine_per_day

        transaction.return_date = timezone.now()
        transaction.save()

        book = transaction.book
        book.available_copies += 1
        book.save()

        serializer = TransactionSerializer(transaction)
        return Response({'success': 'Book returned successfully', 'transaction': serializer.data})
    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """
    Provides various statistics for the admin dashboard, such as total books, users,
    transactions, active borrows, overdue books, total fines, and popular books.
    """
    if not _check_admin_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    total_books = Book.objects.count()
    total_users = User.objects.count()
    total_transactions = Transaction.objects.count()
    active_borrows = Transaction.objects.filter(
        return_date__isnull=True).count()
    overdue_books = Transaction.objects.filter(
        return_date__isnull=True,
        due_date__lt=timezone.now()
    ).count()
    total_fines = Transaction.objects.aggregate(
        Sum('fine_amount'))['fine_amount__sum'] or 0

    popular_books = Book.objects.annotate(
        borrow_count=Count('transaction')
    ).order_by('-borrow_count')[:5]
    popular_books_data = BookSerializer(popular_books, many=True).data

    return Response({
        'total_books': total_books,
        'total_users': total_users,
        'total_transactions': total_transactions,
        'active_borrows': active_borrows,
        'overdue_books': overdue_books,
        'total_fines': total_fines,
        'popular_books': popular_books_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_list(request):
    """
    Retrieves a list of all users with their profile details and borrowing statistics.
    Accessible only by admins.
    """
    if not _check_admin_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.all().select_related('userprofile')
    user_data = []

    for user in users:
        profile = user.userprofile
        borrowed_count = Transaction.objects.filter(user=user).count()
        current_borrows = Transaction.objects.filter(
            user=user, return_date__isnull=True).count()
        total_fines = Transaction.objects.filter(user=user).aggregate(
            Sum('fine_amount'))['fine_amount__sum'] or 0

        user_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_type': profile.user_type,
            'phone': profile.phone,
            'borrowed_count': borrowed_count,
            'current_borrows': current_borrows,
            'total_fines': total_fines,
            'date_joined': user.date_joined
        })
    return Response(user_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_transaction_list(request):
    """
    Retrieves a list of all transactions with filtering options by status, user, and book.
    Accessible only by admins.
    """
    if not _check_admin_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    transactions = Transaction.objects.all().select_related('book', 'user')

    status_filter = request.GET.get('status', '')
    if status_filter == 'active':
        transactions = transactions.filter(return_date__isnull=True)
    elif status_filter == 'overdue':
        transactions = transactions.filter(
            return_date__isnull=True, due_date__lt=timezone.now())
    elif status_filter == 'returned':
        transactions = transactions.filter(return_date__isnull=False)

    user_filter = request.GET.get('user', '')
    if user_filter:
        transactions = transactions.filter(
            user__username__icontains=user_filter)

    book_filter = request.GET.get('book', '')
    if book_filter:
        transactions = transactions.filter(book__title__icontains=book_filter)

    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_update_user_role(request, user_id):
    """
    Allows an admin to update the role of a specific user (student, librarian, admin).
    """
    if not _check_admin_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
        profile = UserProfile.objects.get(user=user)

        new_role = request.data.get('user_type')
        if new_role in ['student', 'librarian', 'admin']:
            profile.user_type = new_role
            profile.save()
            return Response({'success': f'User role updated to {new_role}'})
        else:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_generate_report(request):
    """
    Generates a report (e.g., monthly) with statistics on borrows, returns, and fines.
    Accessible only by admins.
    """
    if not _check_admin_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    report_type = request.GET.get('type', 'monthly')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    if report_type == 'monthly':
        start_of_month = timezone.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0)
        transactions = Transaction.objects.filter(
            issue_date__gte=start_of_month)

        total_borrows = transactions.count()
        total_returns = transactions.filter(return_date__isnull=False).count()
        total_fines = transactions.aggregate(Sum('fine_amount'))[
            'fine_amount__sum'] or 0

        return Response({
            'report_type': 'monthly',
            'period': start_of_month.strftime('%B %Y'),
            'total_borrows': total_borrows,
            'total_returns': total_returns,
            'total_fines': total_fines,
            'transactions': TransactionSerializer(transactions, many=True).data
        })
    return Response({'error': 'Invalid report type'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_generate_pdf_report(request):
    """
    Generates a PDF report (e.g., monthly) with library statistics.
    Accessible only by admins.
    """
    if not _check_admin_permission(request):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    report_type = request.GET.get('type', 'monthly')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    if report_type == 'monthly':
        start_of_month = timezone.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0)
        transactions = Transaction.objects.filter(
            issue_date__gte=start_of_month)

        total_borrows = transactions.count()
        total_returns = transactions.filter(return_date__isnull=False).count()
        total_fines = transactions.aggregate(Sum('fine_amount'))[
            'fine_amount__sum'] or 0

        html_string = render_to_string('monthly_report.html', {
            'period': start_of_month.strftime('%B %Y'),
            'total_borrows': total_borrows,
            'total_returns': total_returns,
            'total_fines': total_fines,
            'transactions': transactions
        })

        pdf_file = weasyprint.HTML(string=html_string).write_pdf()
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response[
            'Content-Disposition'] = f'attachment; filename="monthly_report_{start_of_month.strftime("%Y_%m")}.pdf"'
        return response
    return Response({'error': 'Invalid report type'}, status=status.HTTP_400_BAD_REQUEST)

# --- Other Views (potentially for rendering HTML pages) ---


def admin_update_book(request, book_id):
    """
    Renders the admin update book HTML page.
    (Note: This is a Django render view, not a DRF API view)
    """
    return render(request, 'admin/update_book.html', {'book_id': book_id})


def test_view(request):
    """
    A simple test view returning an HTTP response.
    (Note: This is a Django render view, not a DRF API view)
    """
    return HttpResponse("Test successful!")
# Add to views.py
# In views.py - Update the generate_borrow_qr function


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_borrow_qr(request, book_id):
    """
    Generates a QR code for borrowing a specific book
    """
    try:
        book = Book.objects.get(id=book_id)

        # Check if book is available
        if book.available_copies <= 0:
            return Response({'error': 'No copies available'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already has a pending transaction for this book
        existing_pending = Transaction.objects.filter(
            book=book,
            user=request.user,
            status='pending',
            qr_generated_at__gte=timezone.now() - timedelta(hours=24)
        ).exists()

        if existing_pending:
            return Response({
                'error': 'You already have a pending QR for this book',
                'has_existing': True
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create transaction with pending status
        user_profile = UserProfile.objects.get(user=request.user)
        due_date = timezone.now() + timedelta(days=user_profile.borrowing_period)

        transaction = Transaction.objects.create(
            book=book,
            user=request.user,
            due_date=due_date,
            status='pending',
            qr_generated_at=timezone.now()
        )

        # Generate QR code for the transaction
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(f"BORROW:{transaction.id}")
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')

        # Save QR code
        file_name = f'borrow_qr_{transaction.id}.png'
        transaction.qr_code.save(file_name, File(buffer), save=True)

        # Return the QR code URL
        qr_code_url = request.build_absolute_uri(transaction.qr_code.url)

        return Response({
            'success': 'QR code generated successfully',
            'qr_code_url': qr_code_url,
            'transaction_id': transaction.id,
            'expires_at': transaction.qr_generated_at + timedelta(hours=24)
        })

    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
# In views.py - Add this endpoint


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_pending_qr(request, book_id):
    """
    Check if user already has a pending QR for this book.
    """
    try:
        book = Book.objects.get(id=book_id)

        # Check for existing pending QR
        existing_transaction = Transaction.objects.filter(
            book=book,
            user=request.user,
            status='pending',
            qr_generated_at__gte=timezone.now() - timedelta(hours=24)
        ).first()

        if existing_transaction and existing_transaction.qr_code:
            return Response({
                'has_pending': True,
                'qr_url': request.build_absolute_uri(existing_transaction.qr_code.url)
            })
        else:
            return Response({'has_pending': False})

    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=404)

# In views.py - Add this endpoint


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_existing_qr(request, book_id):
    """
    Get existing QR code for a book that user already requested.
    """
    try:
        # Find the most recent pending QR for this book
        existing_transaction = Transaction.objects.filter(
            book_id=book_id,
            user=request.user,
            status='pending'
        ).order_by('-qr_generated_at').first()

        if existing_transaction and existing_transaction.qr_code:
            return Response({
                'exists': True,
                'qr_url': request.build_absolute_uri(existing_transaction.qr_code.url),
                'generated_at': existing_transaction.qr_generated_at,
                'expires_at': existing_transaction.qr_generated_at + timedelta(hours=24)
            })
        else:
            return Response({'exists': False, 'message': 'No pending QR code found'})

    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_borrow_transaction(request, transaction_id):
    """
    Validates a borrow transaction QR code.
    """
    try:
        if not _check_admin_or_librarian_permission(request):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        transaction = Transaction.objects.get(id=transaction_id)

        # Check if QR is expired
        expiry_time = transaction.qr_generated_at + \
            timedelta(hours=transaction.qr_expiry_hours)
        if timezone.now() > expiry_time:
            transaction.status = 'cancelled'
            transaction.save()
            return Response({'valid': False, 'error': 'QR code has expired'})

        # Check if already used
        if transaction.status != 'pending':
            return Response({'valid': False, 'error': 'QR code already used'})
        # Check if transaction is still valid
        if transaction.return_date is not None:
            return Response({'valid': False, 'error': 'Transaction already processed'})

        # Check if book is still available
        if transaction.book.available_copies <= 0:
            return Response({'valid': False, 'error': 'Book no longer available'})

        # Return transaction details
        transaction_data = {
            'id': transaction.id,
            'user_name': transaction.user.username,
            'user_roll': transaction.user.userprofile.roll_number or 'N/A',
            'book_title': transaction.book.title,
            'book_author': transaction.book.author,
            'due_date': transaction.due_date.strftime('%Y-%m-%d')
        }

        return Response({'valid': True, 'transaction': transaction_data})

    except Transaction.DoesNotExist:
        return Response({'valid': False, 'error': 'Transaction not found'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_pending_transactions(request):
    """
    Get all pending QR transactions for the user
    """
    pending_transactions = Transaction.objects.filter(
        user=request.user,
        status='pending'
    ).select_related('book')

    transactions_data = []
    for transaction in pending_transactions:
        expiry_time = transaction.qr_generated_at + \
            timedelta(hours=transaction.qr_expiry_hours)
        time_remaining = expiry_time - timezone.now()
        hours_remaining = max(0, time_remaining.total_seconds() / 3600)

        transactions_data.append({
            'id': transaction.id,
            'book_title': transaction.book.title,
            'book_author': transaction.book.author,
            'qr_generated_at': transaction.qr_generated_at,
            'expiry_time': expiry_time,
            'hours_remaining': round(hours_remaining, 1),
            'is_expired': hours_remaining <= 0,
            'qr_code_url': request.build_absolute_uri(transaction.qr_code.url) if transaction.qr_code else None
        })

    return Response(transactions_data)

# In views.py - Add this endpoint


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_qr(request, book_id):
    """
    Get user's existing QR code for a book.
    """
    try:
        # Find user's most recent pending QR for this book
        transaction = Transaction.objects.filter(
            book_id=book_id,
            user=request.user,
            status='pending'
        ).order_by('-qr_generated_at').first()

        if transaction and transaction.qr_code:
            return Response({
                'success': True,
                'qr_url': request.build_absolute_uri(transaction.qr_code.url),
                'generated_at': transaction.qr_generated_at,
                'expires_at': transaction.qr_generated_at + timedelta(hours=24)
            })
        else:
            return Response({
                'success': False,
                'message': 'No active QR code found'
            })

    except Exception as e:
        return Response({'success': False, 'error': str(e)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def issue_book_via_qr(request, transaction_id):
    """
    Issues a book after QR validation.
    """
    try:
        if not _check_admin_or_librarian_permission(request):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        transaction = Transaction.objects.get(id=transaction_id)

        # Check if transaction is still valid
        if transaction.return_date is not None:
            return Response({'error': 'Transaction already processed'})

        # Check if book is still available
        if transaction.book.available_copies <= 0:
            return Response({'error': 'Book no longer available'})

        # Update book available copies
        book = transaction.book
        book.available_copies -= 1
        book.save()

        # Set issue date if not set
        if not transaction.issue_date:
            transaction.issue_date = timezone.now()
            transaction.save()

        return Response({
            'success': 'Book issued successfully',
            'due_date': transaction.due_date.strftime('%Y-%m-%d')
        })

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_book_borrow_info(request, book_id):
    """
    Gets information about a book's current borrow status.
    """
    try:
        if not _check_admin_or_librarian_permission(request):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        book = Book.objects.get(id=book_id)

        # Check if book is currently borrowed
        active_transaction = Transaction.objects.filter(
            book=book,
            return_date__isnull=True
        ).first()

        if active_transaction:
            return Response({
                'borrowed': True,
                'book_title': book.title,
                'book_author': book.author,
                'user_name': active_transaction.user.username,
                'user_roll': active_transaction.user.userprofile.roll_number or 'N/A',
                'issue_date': active_transaction.issue_date.strftime('%Y-%m-%d'),
                'due_date': active_transaction.due_date.strftime('%Y-%m-%d'),
                'transaction_id': active_transaction.id
            })
        else:
            return Response({'borrowed': False})

    except Book.DoesNotExist:
        return Response({'error': 'Book not found'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def return_book_via_qr(request, transaction_id):
    """
    Processes a book return via QR code.
    """
    try:
        if not _check_admin_or_librarian_permission(request):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        transaction = Transaction.objects.get(id=transaction_id)

        # Check if book is already returned
        if transaction.return_date:
            return Response({'error': 'Book already returned'})

        # Calculate fine if overdue
        today = timezone.now().date()
        due_date = transaction.due_date.date()

        if today > due_date:
            days_overdue = (today - due_date).days
            fine_per_day = 5  # ₹5 per day fine
            transaction.fine_amount = days_overdue * fine_per_day

        # Update transaction
        transaction.return_date = timezone.now()
        transaction.save()

        # Update book available copies
        book = transaction.book
        book.available_copies += 1
        book.save()

        return Response({
            'success': 'Book returned successfully',
            'fine_amount': transaction.fine_amount
        })

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'})

# views.py


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_return(request, transaction_id):
    """User requests to return a book, generates return QR"""
    try:
        transaction = Transaction.objects.get(
            id=transaction_id, user=request.user)

        if transaction.status != 'borrowed':
            return Response({'error': 'Book not currently borrowed'}, status=400)

        # Create return request
        return_request = ReturnRequest.objects.create(transaction=transaction)

        # Generate return QR code
        qr_data = f"RETURN:{return_request.id}"
        # ... generate QR code logic ...

        return Response({
            'success': 'Return QR generated',
            'qr_code_url': qr_code_url,
            'return_request_id': return_request.id
        })

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_return(request, return_request_id):
    """Librarian processes return by scanning QR"""
    try:
        if not _check_admin_or_librarian_permission(request):
            return Response({'error': 'Permission denied'}, status=403)

        return_request = ReturnRequest.objects.get(
            id=return_request_id, status='pending')
        transaction = return_request.transaction

        # Process return
        transaction.return_date = timezone.now()
        transaction.save()

        # Update book availability
        book = transaction.book
        book.available_copies += 1
        book.save()

        # Mark return request as completed
        return_request.status = 'completed'
        return_request.processed_at = timezone.now()
        return_request.save()

        return Response({
            'success': 'Book returned successfully',
            'fine_amount': transaction.fine_amount
        })

    except ReturnRequest.DoesNotExist:
        return Response({'error': 'Return request not found or already processed'}, status=404)

# views.py - Add this endpoint


@api_view(['GET'])
@permission_classes([AllowAny])
def book_detail(request, book_id):
    """
    Get detailed information for a single book.
    """
    try:
        book = Book.objects.get(id=book_id)
        serializer = BookSerializer(book)
        return Response(serializer.data)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)


# our registration process
@api_view(['POST'])
@permission_classes([AllowAny])
def start_registration(request):
    """
    Step 1 of registration: Receives user data, validates it,
    saves it as a pending registration, and sends an OTP email.
    """
    try:
        # Extract all data from the request
        data = request.data
        email = data.get('email')
        role = data.get('user_type')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        college_id = data.get('college_id', '')
        roll_number = data.get('roll_number', '')
        department = data.get('department', '')
        year_of_study = data.get('year_of_study')
        designation = data.get('designation', '')
        phone = data.get('phone', '')

        # ===== 1. VALIDATION =====
        errors = {}

        # Validate email format and uniqueness
        try:
            validate_email(email)
        except ValidationError:
            errors['email'] = 'Please provide a valid email address.'

        if User.objects.filter(email=email).exists():
            errors['email'] = 'This email is already registered.'

        # Validate role is allowed for self-registration
        if role not in ['student', 'teacher']:
            errors['role'] = 'Invalid role selected for registration.'

        # Validate required fields based on role
        # In start_registration view, replace the college_id check with:
        if role in ['student', 'teacher']:
            college_id = data.get('college_id', '').strip()
        if not college_id:
            errors['college_id'] = 'College ID is required.'
        elif UserProfile.objects.filter(college_id=college_id).exists():
            errors['college_id'] = 'This College ID is already registered.'

        # Check if college_id is already used (basic check)
        if college_id and UserProfile.objects.filter(college_id=college_id).exists():
            errors['college_id'] = 'This College ID is already registered.'

        # If any validation errors, return them
        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        # In start_registration view, add this check:
        if role in ['student', 'teacher']:
            # Get and strip whitespace
            college_id = data.get('college_id', '').strip()
        if not college_id:  # Check if it's empty after stripping
            errors['college_id'] = 'College ID is required.'

        # ===== 2. CHECK FOR EXISTING PENDING REGISTRATION =====
        # Prevent spam by reusing an existing pending reg if it's recent
        try:
            pending_reg = PendingRegistration.objects.get(email=email)
            # If a record exists but is expired, we can delete it and create a new one
            if pending_reg.is_otp_expired():
                pending_reg.delete()
            else:
                # If a recent pending reg exists, tell the user to check their email
                return Response({
                    'error': 'A verification code has already been sent to this email. Please check your inbox or wait for it to expire.'
                }, status=status.HTTP_409_CONFLICT)
        except PendingRegistration.DoesNotExist:
            # No existing pending registration, which is good. Continue.
            pass

        # ===== 3. SAVE DATA AND SEND OTP =====
        # Generate a new OTP
        otp_code = generate_otp()

        # Prepare all data to be stored as JSON
        registration_data = {
            'email': email,
            'user_type': role,
            'first_name': first_name,
            'last_name': last_name,
            'college_id': college_id,
            'roll_number': roll_number,
            'department': department,
            'year_of_study': year_of_study,
            'designation': designation,
            'phone': phone,
        }

        # Create the pending registration record
        pending_reg = PendingRegistration.objects.create(
            email=email,
            otp_code=otp_code,
            registration_data=registration_data
        )

        # Send the OTP email
        email_sent = send_otp_email(email, otp_code)

        if not email_sent:
            # If email failed to send, delete the pending registration and return an error
            pending_reg.delete()
            return Response({
                'error': 'Failed to send verification email. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # ===== 4. SUCCESS RESPONSE =====
        return Response({
            'success': f'Verification code sent to {email}. Please check your inbox.',
            'email': email  # Echo back the email for frontend convenience
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        # Catch any unexpected errors
        print(f"Registration error: {str(e)}")  # Log for debugging
        return Response({
            'error': 'An unexpected error occurred during registration. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# otp verification


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_registration_otp(request):
    """
    Step 2 of registration: Verifies the OTP code sent to the user's email.
    """
    try:
        data = request.data
        email = data.get('email')
        otp_code = data.get('otp_code')

        # Basic validation
        if not email or not otp_code:
            return Response({
                'error': 'Email and OTP code are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Find the pending registration
        try:
            pending_reg = PendingRegistration.objects.get(email=email)
        except PendingRegistration.DoesNotExist:
            return Response({
                'error': 'No registration found for this email. Please start the registration process again.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if OTP is expired
        if pending_reg.is_otp_expired():
            # Clean up the expired record
            pending_reg.delete()
            return Response({
                'error': 'The verification code has expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if OTP is already verified
        if pending_reg.is_verified:
            return Response({
                'error': 'This email has already been verified. Please proceed to create your password.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if the OTP code matches
        if pending_reg.otp_code != otp_code:
            return Response({
                'error': 'Invalid verification code. Please try again.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # If all checks pass, mark as verified
        pending_reg.is_verified = True
        pending_reg.save()

        return Response({
            'success': 'Email verified successfully! Please create your password.',
            'email': email
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"OTP verification error: {str(e)}")
        return Response({
            'error': 'An unexpected error occurred during verification. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Complete registration
@api_view(['POST'])
@permission_classes([AllowAny])
def complete_registration(request):
    """
    Robust registration that works with signals
    """
    import logging
    logger = logging.getLogger(__name__)

    pending_reg = None

    try:
        data = request.data
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        logger.info(f"Registration attempt for: {email}")

        # Validation
        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=400)

        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=400)

        # Find pending registration
        try:
            pending_reg = PendingRegistration.objects.get(
                email=email, is_verified=True)
        except PendingRegistration.DoesNotExist:
            return Response({'error': 'No verified registration found. Please complete email verification.'}, status=404)

        reg_data = pending_reg.registration_data

        # Check for existing user
        if User.objects.filter(email=email).exists():
            pending_reg.delete()
            return Response({'error': 'This email is already registered.'}, status=400)

        try:
            with transaction.atomic():
                # Generate username
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                    if counter > 50:
                        raise Exception("Username generation failed")

                logger.info(f"Creating user: {username}")

                # Create user - signals will handle profile creation
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=reg_data.get('first_name', ''),
                    last_name=reg_data.get('last_name', ''),
                    is_active=True
                )

                # Wait a moment for signals to process
                import time
                time.sleep(0.5)

                # Get the created profile and update it with registration data
                try:
                    profile = UserProfile.objects.get(user=user)

                    # Update profile with registration data
                    user_type = reg_data.get('user_type', 'student')
                    profile.user_type = user_type

                    # Set borrowing limits based on role
                    if user_type == 'teacher':
                        profile.borrowing_limit = 10
                        profile.borrowing_period = 28
                    elif user_type == 'librarian':
                        profile.borrowing_limit = 15
                        profile.borrowing_period = 35
                    elif user_type == 'admin':
                        profile.borrowing_limit = 20
                        profile.borrowing_period = 42
                    else:  # student
                        profile.borrowing_limit = 5
                        profile.borrowing_period = 14

                    # Additional profile fields
                    profile.phone = reg_data.get('phone', '')
                    profile.college_id = reg_data.get('college_id', '')
                    profile.roll_number = reg_data.get('roll_number', '')
                    profile.department = reg_data.get('department', '')
                    profile.year_of_study = reg_data.get('year_of_study')
                    profile.designation = reg_data.get('designation', '')

                    profile.save()
                    logger.info(f"Profile updated for user: {username}")

                except UserProfile.DoesNotExist:
                    logger.error(f"Profile not created for user: {username}")
                    # Create profile manually if signal failed
                    UserProfile.objects.create(
                        user=user,
                        user_type=reg_data.get('user_type', 'student'),
                        # ... other fields
                    )

                # Delete pending registration
                pending_reg.delete()
                logger.info(f"Registration completed for: {email}")

                return Response({
                    'success': 'Account created successfully! You can now login.',
                    'user_id': user.id,
                    'email': user.email,
                    'username': user.username
                }, status=201)

        except IntegrityError as e:
            logger.error(f"Integrity error during registration: {e}")
            return Response({'error': 'Registration failed due to system error. Please try again.'}, status=400)

        except Exception as e:
            logger.error(f"Error during registration: {e}")
            return Response({'error': 'Registration process failed. Please contact support.'}, status=500)

    except Exception as e:
        logger.error(f"Unexpected error in registration: {e}")
        return Response({'error': 'An unexpected error occurred. Please try again later.'}, status=500)


# Get logger instance
logger = logging.getLogger(__name__)

# Add this view function (place it with your other API views)


@api_view(['GET'])
@permission_classes([AllowAny])
def test_log(request):
    """
    Test endpoint to verify logging is working
    """
    # Test different log levels
    logger.debug("🔧 DEBUG level test message")
    logger.info("📝 INFO level test message - Registration system test")
    logger.warning("⚠️ WARNING level test message")
    logger.error("❌ ERROR level test message")

    # Test with variables
    user_ip = request.META.get('REMOTE_ADDR', 'Unknown')
    logger.info(f"🌐 Test log accessed from IP: {user_ip}")

    return Response({
        'success': 'Logging test completed!',
        'message': 'Check your Django console for log messages',
        'log_levels_tested': ['DEBUG', 'INFO', 'WARNING', 'ERROR']
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Step 1: User requests password reset by email
    """
    # We'll implement this
    pass


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """
    Step 2: Verify the reset token is valid
    """
    pass


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_password_reset(request):
    """
    Step 3: Set new password
    """
    pass


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Step 1: User requests password reset by email
    """
    logger.info("🔐 Password reset request received")

    email = request.data.get('email', '').strip().lower()

    if not email:
        return Response({'error': 'Email address is required'}, status=400)

    # Always return success (even if email doesn't exist) for security
    # This prevents attackers from discovering which emails are registered

    try:
        # Create reset token
        reset_token = create_password_reset_token(email)

        if reset_token:
            # Send email with reset link
            email_sent = send_password_reset_email(email, reset_token)

            if email_sent:
                logger.info(f"✅ Password reset email sent to {email}")
            else:
                logger.error(
                    f"❌ Failed to send password reset email to {email}")
        else:
            logger.warning(
                f"⚠️ Password reset requested for non-existent email: {email}")

        # Always return success to prevent email enumeration
        return Response({
            'success': 'If the email address exists in our system, a password reset link has been sent.',
            'message': 'Please check your email inbox and follow the instructions.'
        })

    except Exception as e:
        logger.error(f"❌ Error in password reset request: {e}")
        # Still return success for security
        return Response({
            'success': 'If the email address exists in our system, a password reset link has been sent.',
            'message': 'Please check your email inbox and follow the instructions.'
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """
    Step 2: Verify if a reset token is valid
    """
    token = request.data.get('token', '').strip()

    if not token:
        return Response({'error': 'Reset token is required'}, status=400)

    try:
        reset_token = PasswordResetToken.objects.get(token=token)

        if reset_token.is_valid():
            return Response({
                'valid': True,
                'email': reset_token.user.email,
                'message': 'Token is valid'
            })
        else:
            return Response({
                'valid': False,
                'error': 'This reset link has expired or has already been used'
            }, status=400)

    except PasswordResetToken.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'Invalid reset token'
        }, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_password_reset(request):
    """
    Step 3: Set new password using valid reset token
    """
    token = request.data.get('token', '').strip()
    new_password = request.data.get('new_password', '')

    if not token or not new_password:
        return Response({'error': 'Token and new password are required'}, status=400)

    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters long'}, status=400)

    try:
        reset_token = PasswordResetToken.objects.get(token=token)

        if not reset_token.is_valid():
            return Response({
                'error': 'This reset link has expired or has already been used'
            }, status=400)

        # Update user's password
        user = reset_token.user
        user.set_password(new_password)  # This properly hashes the password
        user.save()

        # Mark token as used
        reset_token.mark_as_used()

        logger.info(f"✅ Password successfully reset for user: {user.email}")

        return Response({
            'success': 'Password has been reset successfully!',
            'message': 'You can now login with your new password.'
        })

    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Invalid reset token'}, status=400)
    except Exception as e:
        logger.error(f"❌ Error resetting password: {e}")
        return Response({'error': 'Failed to reset password'}, status=500)


@api_view(['POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def handle_book_rating(request, book_id):
    """
    Handle book ratings: add, update, or delete rating
    """
    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=404)

    if request.method == 'POST' or request.method == 'PUT':
        # Add or update rating
        rating_value = request.data.get('rating')

        if not rating_value or not 1 <= int(rating_value) <= 5:
            return Response({'error': 'Rating must be between 1 and 5'}, status=400)

        # Create or update rating
        rating, created = BookRating.objects.update_or_create(
            user=request.user,
            book=book,
            defaults={'rating': rating_value}
        )

        serializer = BookRatingSerializer(rating)
        action = 'added' if created else 'updated'
        return Response({
            'success': f'Rating {action} successfully',
            'rating': serializer.data
        })

    elif request.method == 'DELETE':
        # Delete rating
        try:
            rating = BookRating.objects.get(user=request.user, book=book)
            rating.delete()
            return Response({'success': 'Rating deleted successfully'})
        except BookRating.DoesNotExist:
            return Response({'error': 'Rating not found'}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_book_ratings(request, book_id):
    """
    Get all ratings for a book
    """
    try:
        book = Book.objects.get(id=book_id)
        ratings = BookRating.objects.filter(book=book).select_related('user')
        serializer = BookRatingSerializer(ratings, many=True)
        return Response(serializer.data)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=404)


@api_view(['POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def handle_book_review(request, book_id):
    """
    Handle book reviews: add, update, or delete review
    """
    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=404)
    
@api_view(['POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def handle_book_review(request, book_id):
    """
    Handle book reviews: add, update, or delete review
    """
    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST' or request.method == 'PUT':
        review_text = request.data.get('review_text', '').strip()

        if not review_text:
            return Response({'error': 'Review text is required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(review_text) < 10:
            return Response({'error': 'Review must be at least 10 characters'}, status=status.HTTP_400_BAD_REQUEST)

        # Create or update review
        review, created = BookReview.objects.update_or_create(
            user=request.user,
            book=book,
            defaults={'review_text': review_text}
        )

        # ✅ ADD THIS: Automatically check achievements after review
        try:
            from .reading_utils import check_achievements_on_review
            awarded_achievements = check_achievements_on_review(request.user)
            if awarded_achievements:
                print(f"🎉 Auto-awarded review achievements for {request.user.username}: {awarded_achievements}")
        except Exception as e:
            logger.error(f"Error in achievement check after review: {e}")

        serializer = BookReviewSerializer(review)
        action = 'added' if created else 'updated'
        return Response({
            'success': f'Review {action} successfully',
            'review': serializer.data
        })

    elif request.method == 'DELETE':
        try:
            review = BookReview.objects.get(user=request.user, book=book)
            review.delete()
            return Response({'success': 'Review deleted successfully'})
        except BookReview.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_book_reviews(request, book_id):
    """
    Get all reviews for a book
    """
    try:
        book = Book.objects.get(id=book_id)
        reviews = BookReview.objects.filter(
            book=book, is_approved=True).select_related('user')
        serializer = BookReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_popular_books(request):
    """
    Get popular books based on ratings
    """
    from django.db.models import Avg, Count

    popular_books = Book.objects.annotate(
        avg_rating=Avg('bookrating__rating'),
        rating_count=Count('bookrating')
    ).filter(
        rating_count__gte=1  # At least one rating
    ).order_by('-avg_rating', '-rating_count')[:10]  # Top 10

    serializer = BookSerializer(
        popular_books, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_reading_dashboard(request):
    """
    Get comprehensive reading dashboard data for the current user
    """
    try:
        user = request.user

        # Get basic reading statistics
        reading_stats = user.get_reading_stats()

        # Get active goals - FIXED
        from django.utils import timezone
        today = timezone.now().date()
        active_goals = ReadingGoal.objects.filter(
            user=user, 
            start_date__lte=today, 
            end_date__gte=today
        )
        
        goals_data = []
        for goal in active_goals:
            progress = goal.progress()
            goals_data.append({
                'id': goal.id,
                'goal_type': goal.get_goal_type_display(),
                'target': goal.target,
                'period': goal.period,
                'progress': progress,
                'start_date': goal.start_date,
                'end_date': goal.end_date
            })

        # Get achievements
        user_achievements = UserAchievement.objects.filter(
            user=user).select_related('achievement')
        achievements_data = []
        for ua in user_achievements:
            achievements_data.append({
                'id': ua.id,
                'name': ua.achievement.name,
                'description': ua.achievement.description,
                'icon': ua.achievement.icon,
                'color': ua.achievement.color,
                'earned_at': ua.earned_at,
                'progress': ua.progress,
                'requirement': ua.achievement.requirement,
                'is_completed': ua.progress >= ua.achievement.requirement
            })

        # Get reading history (last 6 months)
        from datetime import timedelta
        from django.db.models import Count

        six_months_ago = timezone.now() - timedelta(days=180)
        reading_history = Transaction.objects.filter(
            user=user,
            return_date__isnull=False,
            return_date__gte=six_months_ago
        ).extra({
            'month': "EXTRACT(month FROM return_date)",
            'year': "EXTRACT(year FROM return_date)"
        }).values('year', 'month').annotate(
            books_read=Count('id')
        ).order_by('year', 'month')

        # Format reading history for charts
        reading_history_data = []
        for entry in reading_history:
            reading_history_data.append({
                'month': f"{int(entry['month'])}/{int(entry['year'])}",
                'books_read': entry['books_read']
            })

        return Response({
            'success': True,
            'reading_stats': reading_stats,
            'active_goals': goals_data,
            'achievements': achievements_data,
            'reading_history': reading_history_data,
            'total_achievements': Achievement.objects.count()
        })

    except Exception as e:
        logger.error(f"Error generating reading dashboard: {e}")
        return Response({'error': 'Failed to load dashboard data'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_reading_goal(request):
    """
    Create a new reading goal for the user
    """
    try:
        goal_type = request.data.get('goal_type', 'books')
        target = request.data.get('target')
        period = request.data.get('period', 'monthly')

        if not target or int(target) <= 0:
            return Response({'error': 'Valid target is required'}, status=400)

        # Calculate dates based on period
        from django.utils import timezone
        from datetime import timedelta

        start_date = timezone.now().date()
        if period == 'monthly':
            # Set end date to end of current month
            import calendar
            last_day = calendar.monthrange(
                start_date.year, start_date.month)[1]
            end_date = start_date.replace(day=last_day)
        else:  # yearly
            end_date = start_date.replace(month=12, day=31)

        # Create the goal
        goal = ReadingGoal.objects.create(
            user=request.user,
            goal_type=goal_type,
            target=int(target),
            period=period,
            start_date=start_date,
            end_date=end_date
        )

        return Response({
            'success': 'Reading goal created successfully!',
            'goal': {
                'id': goal.id,
                'goal_type': goal.get_goal_type_display(),
                'target': goal.target,
                'period': goal.period,
                'start_date': goal.start_date,
                'end_date': goal.end_date
            }
        })

    except Exception as e:
        logger.error(f"Error creating reading goal: {e}")
        return Response({'error': 'Failed to create reading goal'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_achievements(request):
    """
    Get all available achievements with user progress
    """
    try:
        achievements = Achievement.objects.all()
        achievements_data = []

        for achievement in achievements:
            user_achievement = UserAchievement.objects.filter(
                user=request.user,
                achievement=achievement
            ).first()

            achievements_data.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'icon': achievement.icon,
                'color': achievement.color,
                'requirement': achievement.requirement,
                'user_progress': user_achievement.progress if user_achievement else 0,
                'is_earned': user_achievement.progress >= achievement.requirement if user_achievement else False,
                'earned_at': user_achievement.earned_at if user_achievement else None
            })

        return Response(achievements_data)

    except Exception as e:
        logger.error(f"Error getting achievements: {e}")
        return Response({'error': 'Failed to load achievements'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_new_achievements(request):
    """
    Check and award any new achievements the user qualifies for
    """
    try:
        from .reading_utils import check_and_award_achievements
        new_achievements = check_and_award_achievements(request.user)

        return Response({
            'new_achievements': new_achievements,
            'message': f'Found {len(new_achievements)} new achievements!' if new_achievements else 'No new achievements'
        })

    except Exception as e:
        logger.error(f"Error checking achievements: {e}")
        return Response({'error': 'Failed to check achievements'}, status=500)

# Add to library/views.py - Notification Endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """
    Get all notifications for the current user
    """
    try:
        notifications = Notification.objects.filter(user=request.user)
        
        # Pagination
        page = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 20)
        
        paginator = Paginator(notifications, page_size)
        try:
            notifications_page = paginator.page(page)
        except PageNotAnInteger:
            notifications_page = paginator.page(1)
        except EmptyPage:
            notifications_page = paginator.page(paginator.num_pages)
        
        notifications_data = []
        for notification in notifications_page:
            notifications_data.append({
                'id': notification.id,
                'type': notification.notification_type,
                'title': notification.title,
                'message': notification.message,
                'is_read': notification.is_read,
                'created_at': notification.created_at,
                'related_book_id': notification.related_book.id if notification.related_book else None,
                'related_book_title': notification.related_book.title if notification.related_book else None,
                'action_url': notification.action_url,
                'time_ago': timesince(notification.created_at)
            })
        
        return Response({
            'notifications': notifications_data,
            'total_pages': paginator.num_pages,
            'current_page': notifications_page.number,
            'total_count': paginator.count
        })
        
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        return Response({'error': 'Failed to load notifications'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Mark a notification as read
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        
        return Response({'success': 'Notification marked as read'})
        
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        return Response({'error': 'Failed to update notification'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    Mark all notifications as read for the current user
    """
    try:
        updated_count = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).update(is_read=True)
        
        return Response({
            'success': f'Marked {updated_count} notifications as read'
        })
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        return Response({'error': 'Failed to update notifications'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_notification_count(request):
    """
    Get count of unread notifications for the current user
    """
    try:
        count = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).count()
        
        return Response({'unread_count': count})
        
    except Exception as e:
        logger.error(f"Error counting unread notifications: {e}")
        return Response({'error': 'Failed to get notification count'}, status=500)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def notification_preferences(request):
    """
    Get or update user notification preferences
    """
    try:
        preferences, created = UserNotificationPreference.objects.get_or_create(
            user=request.user
        )
        
        if request.method == 'GET':
            return Response({
                'email_due_reminders': preferences.email_due_reminders,
                'email_overdue_alerts': preferences.email_overdue_alerts,
                'email_fine_notifications': preferences.email_fine_notifications,
                'email_achievements': preferences.email_achievements,
                'email_book_available': preferences.email_book_available,
                'push_due_reminders': preferences.push_due_reminders,
                'push_overdue_alerts': preferences.push_overdue_alerts,
            })
            
        elif request.method == 'PUT':
            data = request.data
            preferences.email_due_reminders = data.get('email_due_reminders', preferences.email_due_reminders)
            preferences.email_overdue_alerts = data.get('email_overdue_alerts', preferences.email_overdue_alerts)
            preferences.email_fine_notifications = data.get('email_fine_notifications', preferences.email_fine_notifications)
            preferences.email_achievements = data.get('email_achievements', preferences.email_achievements)
            preferences.email_book_available = data.get('email_book_available', preferences.email_book_available)
            preferences.push_due_reminders = data.get('push_due_reminders', preferences.push_due_reminders)
            preferences.push_overdue_alerts = data.get('push_overdue_alerts', preferences.push_overdue_alerts)
            preferences.save()
            
            return Response({'success': 'Notification preferences updated'})
            
    except Exception as e:
        logger.error(f"Error with notification preferences: {e}")
        return Response({'error': 'Failed to process preferences'}, status=500)