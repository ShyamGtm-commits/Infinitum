import React, { useState, useEffect, useCallback } from 'react';
import NotificationFilters from './NotificationFilters';
import BulkActionsPanel from './BulkActionsPanel';

// ADD THIS: Mapping function for category filters
const getNotificationTypesForCategory = (category) => {
    const categoryMap = {
        reservation: ['reservation_confirmation', 'reservation_ready', 'reservation_expiring'],
        pickup: ['pickup_reminder'],
        due_reminder: ['due_reminder'],
        overdue: ['overdue'],
        fine: ['fine'],
        achievement: ['achievement'],
        book_available: ['book_available'],
        system: ['system', 'welcome'],
        all: [] // Empty array means all types
    };
    return categoryMap[category] || [];
};

const NotificationsPage = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [filters, setFilters] = useState({
        status: 'all',
        category: 'all',
        date_range: 'all'
    });

    // Build API URL with filters - UPDATED for reservation categories
    const buildApiUrl = (pageNum = 1) => {
        const params = new URLSearchParams({
            page: pageNum,
            page_size: 20,
            status: filters.status,
            date_range: filters.date_range
        });

        // ENHANCED: Handle category filter with backend type mapping
        if (filters.category !== 'all') {
            const backendTypes = getNotificationTypesForCategory(filters.category);
            if (backendTypes.length > 0) {
                // Add each notification type as a separate category parameter
                backendTypes.forEach(type => {
                    params.append('category', type);
                });
            } else {
                // Fallback to original behavior
                params.append('category', filters.category);
            }
        }

        return `http://localhost:8000/api/notifications/?${params}`;
    };

    // Fetch notifications with filters
    const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
        if (loading) return;

        setLoading(true);
        try {
            const response = await fetch(
                buildApiUrl(pageNum),
                { credentials: 'include' }
            );

            if (response.ok) {
                const data = await response.json();

                if (append) {
                    // Append to existing notifications
                    setNotifications(prev => [...prev, ...data.notifications]);
                } else {
                    // Replace notifications
                    setNotifications(data.notifications);
                }

                // Check if there are more pages
                setHasMore(data.pagination.has_next);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, filters]);

    // Reset and fetch when filters change
    useEffect(() => {
        setNotifications([]);
        setPage(1);
        setHasMore(true);
        setSelectedNotifications([]);
        fetchNotifications(1);
    }, [filters]);

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        if (window.innerHeight + document.documentElement.scrollTop
            < document.documentElement.offsetHeight - 100) {
            return;
        }
        if (!loading && hasMore) {
            fetchNotifications(page + 1, true);
        }
    }, [loading, hasMore, page, fetchNotifications]);

    // Add scroll event listener
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Handle filter changes
    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    // Bulk action handler
    const handleBulkAction = async (action) => {
        if (selectedNotifications.length === 0) return;

        let endpoint = '';
        let method = 'POST';

        switch (action) {
            case 'mark_read':
                endpoint = 'bulk/mark-read/';
                break;
            case 'mark_unread':
                // We'll handle this locally since we don't have a backend for mark unread
                setNotifications(prev =>
                    prev.map(notif =>
                        selectedNotifications.includes(notif.id)
                            ? { ...notif, is_read: false }
                            : notif
                    )
                );
                setSelectedNotifications([]);
                return;
            case 'delete':
                endpoint = 'bulk/delete/';
                break;
            case 'archive':
                endpoint = 'bulk/archive/';
                break;
            default:
                return;
        }

        try {
            const response = await fetch(
                `http://localhost:8000/api/notifications/${endpoint}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        notification_ids: selectedNotifications
                    })
                }
            );

            if (response.ok) {
                const result = await response.json();

                // Update local state based on action
                if (action === 'delete') {
                    // Remove deleted notifications
                    setNotifications(prev =>
                        prev.filter(notif => !selectedNotifications.includes(notif.id))
                    );
                } else if (action === 'mark_read' || action === 'archive') {
                    // Mark as read
                    setNotifications(prev =>
                        prev.map(notif =>
                            selectedNotifications.includes(notif.id)
                                ? { ...notif, is_read: true }
                                : notif
                        )
                    );
                }

                // Clear selection
                setSelectedNotifications([]);

                // Show success message
                alert(`✅ ${result.success}`);

                // Refresh if we deleted items and list is empty
                if (action === 'delete' && notifications.length === selectedNotifications.length) {
                    fetchNotifications(1);
                }
            } else {
                const error = await response.json();
                alert(`❌ ${error.error}`);
            }
        } catch (error) {
            console.error('Bulk action error:', error);
            alert('❌ Failed to perform bulk action');
        }
    };

    // Select all visible notifications
    const selectAllVisible = () => {
        setSelectedNotifications(notifications.map(notif => notif.id));
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedNotifications([]);
    };

    // Toggle notification selection
    const toggleSelection = (notificationId) => {
        setSelectedNotifications(prev =>
            prev.includes(notificationId)
                ? prev.filter(id => id !== notificationId)
                : [...prev, notificationId]
        );
    };

    // Mark notification as read (individual)
    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/read/`, {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId ? { ...notif, is_read: true } : notif
                    )
                );
                setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/notifications/read-all/', {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, is_read: true }))
                );
                setSelectedNotifications([]);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // NEW: Enhanced notification icon with reservation support
    const getNotificationIcon = (type) => {
        switch (type) {
            // RESERVATION NOTIFICATIONS - NEW
            case 'reservation_confirmation':
                return 'fas fa-calendar-check text-success';
            case 'reservation_ready':
                return 'fas fa-qrcode text-success';
            case 'reservation_expiring':
                return 'fas fa-clock text-warning';
            case 'pickup_reminder':
                return 'fas fa-book text-info';

            // EXISTING NOTIFICATIONS
            case 'due_reminder':
                return 'fas fa-clock text-warning';
            case 'overdue':
                return 'fas fa-exclamation-triangle text-danger';
            case 'achievement':
                return 'fas fa-trophy text-warning';
            case 'book_available':
                return 'fas fa-book text-success';
            case 'fine':
                return 'fas fa-money-bill-wave text-danger';
            default:
                return 'fas fa-bell text-info';
        }
    };

    // NEW: Enhanced notification badge with reservation support
    const getNotificationBadge = (type) => {
        switch (type) {
            // RESERVATION NOTIFICATIONS - NEW
            case 'reservation_confirmation':
                return 'bg-success';
            case 'reservation_ready':
                return 'bg-success';
            case 'reservation_expiring':
                return 'bg-warning';
            case 'pickup_reminder':
                return 'bg-info';

            // EXISTING NOTIFICATIONS
            case 'due_reminder':
                return 'bg-warning';
            case 'overdue':
                return 'bg-danger';
            case 'achievement':
                return 'bg-warning';
            case 'book_available':
                return 'bg-success';
            case 'fine':
                return 'bg-danger';
            default:
                return 'bg-info';
        }
    };

    // NEW: Safe notification click handler using only your existing routes
    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Define safe routes based on your actual app structure
        const getSafeRoute = (notification) => {
            switch (notification.type) {
                // BOOK-RELATED NOTIFICATIONS - Go to book details
                case 'reservation_confirmation':
                case 'reservation_ready':
                case 'pickup_reminder':
                case 'reservation_expiring':
                case 'book_available':
                    if (notification.related_book_id) {
                        return `/books/${notification.related_book_id}`;
                    }
                    return null;

                // BORROWING NOTIFICATIONS - Go to my-borrows (you have this route)
                case 'due_reminder':
                case 'overdue':
                    return '/my-borrows';

                // FINE NOTIFICATIONS - Go to fines page (you have this route)
                case 'fine':
                    return '/fines';

                // SYSTEM NOTIFICATIONS - Use action_url if it's a safe route
                case 'system':
                case 'welcome':
                    if (notification.action_url) {
                        // Only allow navigation to routes that exist in your app
                        const safeRoutes = [
                            '/books/', '/my-borrows', '/fines', '/my-reservations',
                            '/notifications', '/profile', '/dashboard', '/search'
                        ];
                        const isSafe = safeRoutes.some(route =>
                            notification.action_url.includes(route)
                        );
                        return isSafe ? notification.action_url : null;
                    }
                    return null;

                // ACHIEVEMENTS & OTHER TYPES - No navigation (route doesn't exist)
                case 'achievement':
                default:
                    return null;
            }
        };

        // Get the safe route
        const targetUrl = getSafeRoute(notification);

        if (targetUrl) {
            window.location.href = targetUrl;
        }
        // If no targetUrl, just stay on notifications page (already marked as read)
    };

    // NEW: Format notification type for display
    const formatNotificationType = (type) => {
        const typeMap = {
            // RESERVATION NOTIFICATIONS
            reservation_confirmation: 'Reservation Confirmed',
            reservation_ready: 'Ready for Pickup',
            reservation_expiring: 'Reservation Expiring',
            pickup_reminder: 'Pickup Reminder',

            // EXISTING NOTIFICATIONS
            due_reminder: 'Due Reminder',
            overdue: 'Overdue',
            achievement: 'Achievement',
            book_available: 'Book Available',
            fine: 'Fine',
            system: 'System',
            welcome: 'Welcome'
        };
        return typeMap[type] || type.replace('_', ' ');
    };

    // Count unread notifications in current view
    const unreadCountInView = notifications.filter(n => !n.is_read).length;

    return (
        <div className="container mt-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <i className="fas fa-bell me-2"></i>
                    Notifications
                    {notifications.length > 0 && (
                        <span className="badge bg-secondary ms-2">
                            {notifications.length}
                            {unreadCountInView > 0 && (
                                <span className="ms-1">
                                    ({unreadCountInView} unread)
                                </span>
                            )}
                        </span>
                    )}
                </h2>
                {unreadCountInView > 0 && (
                    <button
                        className="btn btn-outline-primary"
                        onClick={markAllAsRead}
                    >
                        <i className="fas fa-check-double me-2"></i>
                        Mark All as Read
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            <NotificationFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
            />

            {/* Bulk Actions Panel - KEEP YOUR ELEGANT DESIGN */}
            <BulkActionsPanel
                selectedCount={selectedNotifications.length}
                totalCount={notifications.length}
                onBulkAction={handleBulkAction}
                onSelectAll={selectAllVisible}
                onClearSelection={clearSelection}
            />

            {/* Notifications List */}
            {loading && notifications.length === 0 ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading notifications...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-5">
                    <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                    <h4>No notifications found</h4>
                    <p className="text-muted">
                        {filters.status !== 'all' || filters.category !== 'all' || filters.date_range !== 'all'
                            ? 'Try changing your filters to see more notifications.'
                            : 'You don\'t have any notifications yet.'
                        }
                    </p>
                    {(filters.status !== 'all' || filters.category !== 'all' || filters.date_range !== 'all') && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setFilters({ status: 'all', category: 'all', date_range: 'all' })}
                        >
                            <i className="fas fa-refresh me-2"></i>
                            Reset Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="row">
                    <div className="col-12">
                        {/* Enhanced notification item mapping */}
                        {notifications.map(notification => {
                            const isSelected = selectedNotifications.includes(notification.id);
                            const notificationClass = `card mb-3 notification-item ${isSelected ? 'selected' : ''} ${!notification.is_read ? 'border-primary bg-light unread' : 'read'}`;

                            return (
                                <div
                                    key={notification.id}
                                    className={notificationClass}
                                    data-category={notification.type}
                                    data-selected={isSelected}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="card-body">
                                        <div className="d-flex align-items-start">
                                            {/* Selection Checkbox */}
                                            <div className="me-3">
                                                <input
                                                    type="checkbox"
                                                    className={`form-check-input mt-1 ${isSelected ? 'checked' : ''}`}
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelection(notification.id);
                                                    }}
                                                />
                                            </div>

                                            {/* UPDATED: Notification Icon with reservation support */}
                                            <div className="me-3">
                                                <i className={`${getNotificationIcon(notification.type)} fa-lg ${isSelected ? 'text-primary' : ''}`}></i>
                                            </div>

                                            {/* Notification Content */}
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <h5 className={`card-title mb-1 ${isSelected ? 'text-primary' : ''}`}>
                                                        {notification.title}
                                                        {isSelected && (
                                                            <i className="fas fa-check-circle text-primary ms-2"></i>
                                                        )}
                                                    </h5>
                                                    <div>
                                                        {!notification.is_read && (
                                                            <span className={`badge ${isSelected ? 'bg-primary' : 'bg-secondary'} me-2`}>
                                                                New
                                                            </span>
                                                        )}
                                                        {/* UPDATED: Use enhanced badge with reservation support */}
                                                        <span className={`badge ${getNotificationBadge(notification.type)} ${isSelected ? 'border border-white' : ''}`}>
                                                            {formatNotificationType(notification.type)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="card-text">{notification.message}</p>

                                                {/* Book cover if available */}
                                                {notification.related_book_cover && (
                                                    <div className="mb-2">
                                                        <img
                                                            src={notification.related_book_cover}
                                                            alt="Book cover"
                                                            className={isSelected ? 'selected-book-cover' : ''}
                                                            style={{
                                                                width: '60px',
                                                                height: '90px',
                                                                objectFit: 'cover',
                                                                borderRadius: '4px',
                                                                border: isSelected ? '2px solid #0d6efd' : '1px solid #dee2e6'
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-between align-items-center">
                                                    <small className={`text-muted ${isSelected ? 'text-primary' : ''}`}>
                                                        <i className="fas fa-clock me-1"></i>
                                                        {notification.time_ago} ago
                                                    </small>
                                                    <div>
                                                        {!notification.is_read && (
                                                            <button
                                                                className={`btn btn-sm me-2 ${isSelected ? 'btn-outline-success' : 'btn-outline-primary'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsRead(notification.id);
                                                                }}
                                                            >
                                                                <i className="fas fa-check me-1"></i>
                                                                Mark as Read
                                                            </button>
                                                        )}
                                                        <button
                                                            className={`btn btn-sm ${isSelected ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSelection(notification.id);
                                                            }}
                                                        >
                                                            <i className={`fas ${isSelected ? 'fa-times' : 'fa-check'} me-1`}></i>
                                                            {isSelected ? 'Deselect' : 'Select'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Loading indicator for infinite scroll */}
            {loading && notifications.length > 0 && (
                <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className="ms-2">Loading more notifications...</span>
                </div>
            )}

            {/* End of list message */}
            {!hasMore && notifications.length > 0 && (
                <div className="text-center py-3 text-muted">
                    <i className="fas fa-flag-checkered me-2"></i>
                    You've seen all {notifications.length} notifications
                    {filters.status !== 'all' || filters.category !== 'all' || filters.date_range !== 'all'
                        ? ' matching your filters'
                        : ''
                    }
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;