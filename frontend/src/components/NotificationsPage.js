import React, { useState, useEffect } from 'react';

const NotificationsPage = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchNotifications = async (pageNum = 1) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/notifications/?page=${pageNum}&page_size=20`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setTotalPages(data.total_pages);
                setPage(data.current_page);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/read/`, {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId ? { ...notif, is_read: true } : notif
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

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
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

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
            default:
                return 'fas fa-bell text-info';
        }
    };

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
            default:
                return 'bg-info';
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <i className="fas fa-bell me-2"></i>
                    Notifications
                </h2>
                {notifications.some(n => !n.is_read) && (
                    <button
                        className="btn btn-outline-primary"
                        onClick={markAllAsRead}
                    >
                        <i className="fas fa-check-double me-2"></i>
                        Mark All as Read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading notifications...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-5">
                    <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                    <h4>No notifications</h4>
                    <p className="text-muted">You don't have any notifications yet.</p>
                </div>
            ) : (
                <div className="row">
                    <div className="col-12">
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`card mb-3 ${!notification.is_read ? 'border-primary bg-light' : ''}`}
                            >
                                <div className="card-body">
                                    <div className="d-flex align-items-start">
                                        <div className="me-3">
                                            <i className={`${getNotificationIcon(notification.type)} fa-lg`}></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <h5 className="card-title mb-1">{notification.title}</h5>
                                                <div>
                                                    {!notification.is_read && (
                                                        <span className="badge bg-primary">New</span>
                                                    )}
                                                    <span className={`badge ${getNotificationBadge(notification.type)} ms-2`}>
                                                        {notification.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="card-text">{notification.message}</p>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <small className="text-muted">
                                                    {notification.time_ago} ago
                                                </small>
                                                {!notification.is_read && (
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        Mark as Read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <nav aria-label="Notification pagination">
                    <ul className="pagination justify-content-center">
                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => fetchNotifications(page - 1)}
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                        </li>
                        {[...Array(totalPages)].map((_, i) => (
                            <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => fetchNotifications(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => fetchNotifications(page + 1)}
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </li>
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default NotificationsPage;