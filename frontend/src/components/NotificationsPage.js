import React, { useState, useEffect, useCallback } from 'react';
import NotificationFilters from './NotificationFilters';
import BulkActionsPanel from './BulkActionsPanel';

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

    // Build API URL with filters
    const buildApiUrl = (pageNum = 1) => {
        const params = new URLSearchParams({
            page: pageNum,
            page_size: 20,
            status: filters.status,
            category: filters.category,
            date_range: filters.date_range
        });
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

    // Get notification icon
    const getNotificationIcon = (type) => {
        switch (type) {
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

    // Get notification badge color
    const getNotificationBadge = (type) => {
        switch (type) {
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

            {/* Bulk Actions Panel */}
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
                                >
                                    <div className="card-body">
                                        <div className="d-flex align-items-start">
                                            {/* Selection Checkbox */}
                                            <div className="me-3">
                                                <input
                                                    type="checkbox"
                                                    className={`form-check-input mt-1 ${isSelected ? 'checked' : ''}`}
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(notification.id)}
                                                />
                                            </div>

                                            {/* Notification Icon */}
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
                                                        <span className={`badge ${getNotificationBadge(notification.type)} ${isSelected ? 'border border-white' : ''}`}>
                                                            {notification.type.replace('_', ' ')}
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
                                                                onClick={() => markAsRead(notification.id)}
                                                            >
                                                                <i className="fas fa-check me-1"></i>
                                                                Mark as Read
                                                            </button>
                                                        )}
                                                        <button
                                                            className={`btn btn-sm ${isSelected ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
                                                            onClick={() => toggleSelection(notification.id)}
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