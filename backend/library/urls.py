from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ===== AUTHENTICATION & GENERAL =====
    path('status/', views.api_status, name='api_status'),
    path('test/', views.test_view, name='test'),
    path('test-log/', views.test_log, name='test_log'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('csrf/', views.get_csrf_token, name='get_csrf_token'),

    # ===== REGISTRATION & PASSWORD RESET =====
    path('register/start/', views.start_registration, name='start_registration'),
    path('register/verify-otp/', views.verify_registration_otp,
         name='verify_registration_otp'),
    path('register/complete/', views.complete_registration,
         name='complete_registration'),
    path('password-reset/request/', views.request_password_reset,
         name='request_password_reset'),
    path('password-reset/verify-token/',
         views.verify_reset_token, name='verify_reset_token'),
    path('password-reset/complete/', views.complete_password_reset,
         name='complete_password_reset'),

    # ===== BOOKS & SEARCH =====
    path('books/', views.book_list, name='book_list'),
    path('books/search/', views.search_books, name='search_books'),
    path('books/<int:book_id>/', views.book_detail, name='book_detail'),
    path('books/popular/', views.get_popular_books, name='get_popular_books'),

    # ===== USER ACTIONS =====
    path('books/<int:book_id>/borrow/', views.borrow_book, name='borrow_book'),
    path('books/<int:book_id>/rate/',
         views.handle_book_rating, name='handle_book_rating'),
    path('books/<int:book_id>/ratings/',
         views.get_book_ratings, name='get_book_ratings'),
    path('books/<int:book_id>/review/',
         views.handle_book_review, name='handle_book_review'),
    path('books/<int:book_id>/reviews/',
         views.get_book_reviews, name='get_book_reviews'),
    path('user/reservations/', views.user_reservations, name='user_reservations'),
    path('user/reservations/count/', views.user_reservations_count, name='user_reservations_count'),
    path('reservations/<int:transaction_id>/cancel/',
         views.cancel_reservation, name='cancel_reservation'),

    # ===== QR SYSTEM =====
    path('books/<int:book_id>/generate_borrow_qr/',
         views.generate_borrow_qr, name='generate_borrow_qr'),
    path('books/<int:book_id>/check_pending_qr/',
         views.check_pending_qr, name='check_pending_qr'),
    path('books/<int:book_id>/get_existing_qr/',
         views.get_existing_qr, name='get_existing_qr'),
    path('books/<int:book_id>/get_my_qr/', views.get_my_qr, name='get_my_qr'),
    path('books/return/<int:transaction_id>/generate-qr/',
         views.generate_return_qr, name='generate_return_qr'),
    path('fix-missing-qr/<int:transaction_id>/',
         views.fix_missing_qr, name='fix_missing_qr'),

    # ===== USER PROFILE & TRANSACTIONS =====
    path('profile/', views.user_profile, name='user_profile'),
    path('profile/history/', views.user_reading_history,
         name='user_reading_history'),
    path('transactions/', views.user_transactions, name='user_transactions'),
    path('user/transactions/', views.user_transactions, name='user_transactions'),
    path('user/pending-transactions/', views.user_pending_transactions,
         name='user_pending_transactions'),
    path('user/active-borrows/', views.user_active_borrows,
         name='user_active_borrows'),
    path('transactions/<int:transaction_id>/return/', views.return_book,
         name='return_book'),  # User-initiated return
    path('transactions/<int:transaction_id>/pay_fine/',
         views.pay_fine, name='pay_fine'),
    path('fines/', views.user_fines, name='user_fines'),
    path('fines/pay_all/', views.pay_all_fines, name='pay_all_fines'),

    # ===== RECOMMENDATIONS =====
    path('recommendations/', views.book_recommendations,
         name='book_recommendations'),
    path('recommendations/insights/', views.recommendation_insights,
         name='recommendation_insights'),

    # ===== DASHBOARD & ACHIEVEMENTS =====
    path('dashboard/reading/', views.user_reading_dashboard,
         name='user_reading_dashboard'),
    path('dashboard/goals/create/', views.create_reading_goal,
         name='create_reading_goal'),
    path('dashboard/achievements/',
         views.get_available_achievements, name='get_achievements'),
    path('dashboard/achievements/check/',
         views.check_new_achievements, name='check_achievements'),

    # ===== NOTIFICATIONS =====
    path('notifications/', views.get_user_notifications, name='get_notifications'),
    path('notifications/<int:notification_id>/read/',
         views.mark_notification_read, name='mark_notification_read'),
    path('notifications/read-all/', views.mark_all_notifications_read,
         name='mark_all_notifications_read'),
    path('notifications/unread-count/', views.get_unread_notification_count,
         name='unread_notification_count'),
    path('notifications/preferences/', views.notification_preferences,
         name='notification_preferences'),
    path('notifications/bulk/mark-read/',
         views.bulk_mark_notifications_read, name='bulk_mark_read'),
    path('notifications/bulk/delete/',
         views.bulk_delete_notifications, name='bulk_delete'),
    path('notifications/bulk/archive/',
         views.bulk_archive_notifications, name='bulk_archive'),

    # ===== ADMIN ENDPOINTS =====
    path('admin/stats/', views.admin_dashboard_stats,
         name='admin_dashboard_stats'),
    path('admin/users/', views.admin_user_list, name='admin_user_list'),
    path('admin/transactions/', views.admin_transaction_list,
         name='admin_transaction_list'),
    path('admin/users/<int:user_id>/update_role/',
         views.admin_update_user_role, name='admin_update_user_role'),
    path('admin/books/add/', views.admin_add_book, name='admin_add_book'),
    path('admin/books/<int:book_id>/update/',
         views.admin_update_book, name='admin_update_book'),
    path('admin/books/<int:book_id>/delete/',
         views.admin_delete_book, name='admin_delete_book'),
    path('admin/security/audit-logs/',
         views.security_audit_logs, name='security_audit_logs'),
    path('admin/security/dashboard/',
         views.security_dashboard, name='security_dashboard'),
    path('admin/reports/pdf/', views.admin_generate_pdf_report,
         name='admin_generate_pdf_report'),
    path('admin/analytics/advanced/', views.admin_advanced_analytics,
         name='admin_advanced_analytics'),

    # ===== LIBRARIAN ENDPOINTS =====
    path('librarian/transactions/active/', views.librarian_active_transactions,
         name='librarian_active_transactions'),
    path('librarian/issue/', views.librarian_manual_issue,
         name='librarian_manual_issue'),
    path('librarian/return/<int:transaction_id>/', views.librarian_manual_return,
         name='librarian_manual_return'),  # Manual return
    path('librarian/validate-qr/', views.validate_borrow_qr, name='validate_qr'),
    path('librarian/transactions/<int:transaction_id>/validate/',
         views.validate_borrow_transaction, name='validate_borrow_transaction'),
    path('librarian/issue-book/', views.issue_book_via_qr, name='issue_book_qr'),
    path('librarian/issued-books/', views.librarian_issued_books,
         name='librarian_issued_books'),
    path('librarian/books/<int:book_id>/borrow_info/',
         views.get_book_borrow_info, name='get_book_borrow_info'),
    path('librarian/transactions/<int:transaction_id>/return/',
         views.return_book_via_qr, name='return_book_via_qr'),  # QR return
    path('librarian/decode-qr-image/',
         views.decode_qr_image, name='decode_qr_image'),
    path('librarian/validate-return-qr/',
         views.validate_return_qr, name='validate_return_qr'),
    path('librarian/process-book-return/', views.process_book_return,
         name='process_book_return')  # Unified return processing

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
