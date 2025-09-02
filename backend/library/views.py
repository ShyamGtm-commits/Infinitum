from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q, Count, Sum
from .models import Book, UserProfile, Transaction
from .serializers import BookSerializer, UserSerializer, UserProfileSerializer, TransactionSerializer
from datetime import datetime, timedelta
from django.utils import timezone
from django.http import HttpResponse
from django.template.loader import render_to_string
import weasyprint
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

# library/views.py


@api_view(['GET'])
@permission_classes([AllowAny])
def api_status(request):
    return Response({"status": "API is working!"})


def admin_update_book(request, book_id):
    # Your update logic here
    return render(request, 'admin/update_book.html', {'book_id': book_id})


def test_view(request):
    return HttpResponse("Test successful!")


# Admin - Add new book


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_book(request):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    # Handle file upload
    data = request.data.copy()
    if 'cover_image' in request.FILES:
        data['cover_image'] = request.FILES['cover_image']

    serializer = BookSerializer(data=data)
    if serializer.is_valid():
        book = serializer.save()
        return Response({
            'success': 'Book added successfully!',
            'book': BookSerializer(book).data
        }, status=status.HTTP_201_CREATED)

    # Return specific validation errors
    return Response({
        'error': 'Validation failed',
        'details': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

# Admin - Delete book


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_book(request, book_id):
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        book = Book.objects.get(id=book_id)
        book.delete()
        return Response({'success': 'Book deleted successfully'})
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

# Admin - Generate PDF report


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_generate_pdf_report(request):
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    report_type = request.GET.get('type', 'monthly')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    # Get data based on report type
    if report_type == 'monthly':
        start_of_month = timezone.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0)
        transactions = Transaction.objects.filter(
            issue_date__gte=start_of_month)

        total_borrows = transactions.count()
        total_returns = transactions.filter(return_date__isnull=False).count()
        total_fines = transactions.aggregate(Sum('fine_amount'))[
            'fine_amount__sum'] or 0

        # Generate PDF
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

# Librarian - View all active transactions


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def librarian_active_transactions(request):
    user_profile = UserProfile.objects.get(user=request.user)
    if user_profile.user_type not in ['admin', 'librarian']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    transactions = Transaction.objects.filter(
        return_date__isnull=True
    ).select_related('book', 'user').order_by('due_date')

    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)

# Librarian - Manual book issue


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def librarian_manual_issue(request):
    user_profile = UserProfile.objects.get(user=request.user)
    if user_profile.user_type not in ['admin', 'librarian']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    book_id = request.data.get('book_id')
    username = request.data.get('username')

    try:
        book = Book.objects.get(id=book_id)
        user = User.objects.get(username=username)

        if book.available_copies <= 0:
            return Response({'error': 'No copies available'}, status=status.HTTP_400_BAD_REQUEST)

        # Create transaction
        transaction = Transaction.objects.create(
            book=book,
            user=user,
            due_date=timezone.now() + timedelta(weeks=2)
        )

        # Update available copies
        book.available_copies -= 1
        book.save()

        serializer = TransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# Librarian - Manual book return


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def librarian_manual_return(request, transaction_id):
    user_profile = UserProfile.objects.get(user=request.user)
    if user_profile.user_type not in ['admin', 'librarian']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        transaction = Transaction.objects.get(id=transaction_id)

        if transaction.return_date:
            return Response({'error': 'Book already returned'}, status=status.HTTP_400_BAD_REQUEST)

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

        # Update book availability
        book = transaction.book
        book.available_copies += 1
        book.save()

        serializer = TransactionSerializer(transaction)
        return Response({'success': 'Book returned successfully', 'transaction': serializer.data})

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

# User profile management


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    try:
        profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        # Users can only update their own profile
        if profile.user != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserProfileSerializer(
            profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# User reading history


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_reading_history(request):
    transactions = Transaction.objects.filter(
        user=request.user
    ).select_related('book').order_by('-issue_date')

    # Create a list of books with reading stats
    reading_history = []
    for transaction in transactions:
        reading_history.append({
            'book': BookSerializer(transaction.book).data,
            'issue_date': transaction.issue_date,
            'return_date': transaction.return_date,
            'status': 'Returned' if transaction.return_date else 'Borrowed'
        })

    return Response(reading_history)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        user_type = request.data.get('user_type', 'student')

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username, password=password, email=email)
        UserProfile.objects.create(user=user, user_type=user_type)

        return Response({'success': 'User created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_csrf_token(request):
    return Response({'detail': 'CSRF cookie set'})


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        user_profile = UserProfile.objects.get(user=user)
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user_profile.user_type
        }
        return Response({'success': 'Login successful', 'user': user_data})
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_user(request):
    logout(request)
    return Response({'success': 'Logout successful'})


# For public endpoints (like book list, search)
@api_view(['GET'])
@permission_classes([AllowAny])  # Add this for public access
def book_list(request):
    books = Book.objects.all()
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def borrow_book(request, book_id):
    try:
        book = Book.objects.get(id=book_id)
        if book.available_copies > 0:
            # Check if user already has this book
            existing_transaction = Transaction.objects.filter(
                book=book,
                user=request.user,
                return_date__isnull=True
            ).exists()

            if existing_transaction:
                return Response({'error': 'You already have this book'}, status=status.HTTP_400_BAD_REQUEST)

            # Create transaction
            transaction = Transaction.objects.create(
                book=book,
                user=request.user,
                due_date=timezone.now() + timedelta(weeks=2)
            )

            # Update available copies
            book.available_copies -= 1
            book.save()

            serializer = TransactionSerializer(transaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'No copies available'}, status=status.HTTP_400_BAD_REQUEST)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_transactions(request):
    transactions = Transaction.objects.filter(
        user=request.user).order_by('-issue_date')
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_books(request):
    """
    Search books with multiple filters: title, author, genre, year range
    """
    # Get query parameters
    query = request.GET.get('q', '')
    genre = request.GET.get('genre', '')
    author = request.GET.get('author', '')
    year_from = request.GET.get('year_from', '')
    year_to = request.GET.get('year_to', '')
    available_only = request.GET.get(
        'available_only', 'false').lower() == 'true'

    # Start with all books
    books = Book.objects.all()

    # Apply filters
    if query:
        books = books.filter(
            Q(title__icontains=query) |
            Q(author__icontains=query) |
            Q(description__icontains=query)
        )

    # Apply genre filter (exact match)
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

    # Order results
    books = books.order_by('title')

    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def return_book(request, transaction_id):
    try:
        transaction = Transaction.objects.get(
            id=transaction_id, user=request.user)

        if transaction.return_date:
            return Response({'error': 'Book already returned'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate fine if overdue
        today = timezone.now().date()
        due_date = transaction.due_date.date()

        if today > due_date:
            days_overdue = (today - due_date).days
            fine_per_day = 5  # ₹5 per day fine
            transaction.fine_amount = days_overdue * fine_per_day
        else:
            transaction.fine_amount = 0.00

        # Update transaction
        transaction.return_date = timezone.now()
        transaction.save()

        # Update book availability
        book = transaction.book
        book.available_copies += 1
        book.save()

        serializer = TransactionSerializer(transaction)
        return Response({'success': 'Book returned successfully', 'transaction': serializer.data})

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_fines(request):
    """Get all fines for the current user"""
    transactions = Transaction.objects.filter(
        user=request.user,
        fine_amount__gt=0
    ).order_by('-due_date')

    # Calculate total fines
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
    """Mark a fine as paid"""
    try:
        transaction = Transaction.objects.get(
            id=transaction_id, user=request.user)

        if transaction.fine_paid:
            return Response({'error': 'Fine already paid'}, status=status.HTTP_400_BAD_REQUEST)

        if transaction.fine_amount <= 0:
            return Response({'error': 'No fine to pay'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark fine as paid
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
    """Pay all outstanding fines for the user"""
    try:
        unpaid_fines = Transaction.objects.filter(
            user=request.user,
            fine_amount__gt=0,
            fine_paid=False
        )

        if not unpaid_fines.exists():
            return Response({'error': 'No outstanding fines'}, status=status.HTTP_400_BAD_REQUEST)

        total_amount = sum(fine.fine_amount for fine in unpaid_fines)

        # Mark all fines as paid
        unpaid_fines.update(
            fine_paid=True,
            fine_paid_date=timezone.now()
        )

        return Response({
            'success': f'All fines totaling ₹{total_amount} paid successfully',
            'total_paid': total_amount
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_fine(request, transaction_id):
    try:
        transaction = Transaction.objects.get(
            id=transaction_id, user=request.user)

        if transaction.fine_amount <= 0:
            return Response({'error': 'No fine to pay'}, status=status.HTTP_400_BAD_REQUEST)

        # Simulate payment - in real system, integrate with payment gateway
        transaction.fine_amount = 0.00
        transaction.save()

        serializer = TransactionSerializer(transaction)
        return Response({'success': 'Fine paid successfully', 'transaction': serializer.data})

    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

# Admin Dashboard Statistics


# Get all users


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_list(request):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
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

# Get all transactions with filters


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_transaction_list(request):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    transactions = Transaction.objects.all().select_related('book', 'user')

    # Apply filters
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

# Update user role


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_update_user_role(request, user_id):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
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

# Generate reports


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_generate_report(request):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    report_type = request.GET.get('type', 'monthly')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    # Basic implementation - extend based on your needs
    if report_type == 'monthly':
        # Get current month transactions
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

# Admin Dashboard Statistics


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    # Get statistics
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

    # Popular books (most borrowed)
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

# Get all users


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_list(request):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
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

# Get all transactions with filters


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_transaction_list(request):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    transactions = Transaction.objects.all().select_related('book', 'user')

    # Apply filters
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

# Update user role


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_update_user_role(request, user_id):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
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

# Generate reports


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_generate_report(request):
    # Check if user is admin
    if not request.user.is_staff and not UserProfile.objects.get(user=request.user).user_type == 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    report_type = request.GET.get('type', 'monthly')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    # Basic implementation - extend based on your needs
    if report_type == 'monthly':
        # Get current month transactions
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

# Book recommendations based on genre preferences


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_recommendations(request):
    # Get user's most borrowed genres
    user_genres = Transaction.objects.filter(
        user=request.user
    ).values('book__genre').annotate(count=Count('book__genre')).order_by('-count')[:3]

    recommended_books = []

    if user_genres:
        # Get top genres
        top_genres = [item['book__genre'] for item in user_genres]

        # Find books in these genres that the user hasn't borrowed
        borrowed_book_ids = Transaction.objects.filter(
            user=request.user
        ).values_list('book_id', flat=True)

        recommended_books = Book.objects.filter(
            genre__in=top_genres
            # Random order for variety
        ).exclude(id__in=borrowed_book_ids).order_by('?')[:10]

    # If no recommendations based on history, suggest popular books
    if not recommended_books:
        recommended_books = Book.objects.annotate(
            borrow_count=Count('transaction')
        ).order_by('-borrow_count')[:10]

    serializer = BookSerializer(recommended_books, many=True)
    return Response(serializer.data)

# Create your views here.
