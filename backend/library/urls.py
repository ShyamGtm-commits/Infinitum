from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('books/', views.book_list, name='book_list'),
    path('books/search/', views.search_books, name='search_books'),
    path('books/<int:book_id>/borrow/', views.borrow_book, name='borrow_book'),
    path('transactions/', views.user_transactions, name='user_transactions'),
    path('transactions/<int:transaction_id>/return/',
         views.return_book, name='return_book'),
    path('transactions/<int:transaction_id>/pay_fine/',
         views.pay_fine, name='pay_fine'),
    path('admin/stats/', views.admin_dashboard_stats,
         name='admin_dashboard_stats'),
    path('admin/users/', views.admin_user_list, name='admin_user_list'),
    path('admin/transactions/', views.admin_transaction_list,
         name='admin_transaction_list'),
    path('admin/users/<int:user_id>/update_role/',
         views.admin_update_user_role, name='admin_update_user_role'),
    path('admin/reports/', views.admin_generate_report,
         name='admin_generate_report'),

]
