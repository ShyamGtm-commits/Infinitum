import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotificationBell = ({ user }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchUnreadCount = async () => {
        try {
            console.log('Fetching unread count...');
            const response = await fetch('http://localhost:8000/api/notifications/unread-count/', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Unread count response:', data);
                setUnreadCount(data.unread_count);
            } else {
                console.error('Failed to fetch unread count');
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            console.log('Fetching notifications for dropdown...');
            const response = await fetch('http://localhost:8000/api/notifications/?page_size=5', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Notifications response:', data);
                setNotifications(data.notifications);
            } else {
                console.error('Failed to fetch notifications');
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
                setUnreadCount(prev => Math.max(0, prev - 1));
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
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    useEffect(() => {
        if (user) {
            console.log('NotificationBell user:', user);
            fetchUnreadCount();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const toggleDropdown = () => {
        console.log('Toggle dropdown, current state:', showDropdown);
        if (!showDropdown) {
            fetchNotifications();
        }
        setShowDropdown(!showDropdown);
    };

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

    return (
        <div className="notification-bell position-relative">
            <button
                className="btn btn-outline-secondary position-relative"
                onClick={toggleDropdown}
                aria-label="Notifications"
            >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="notification-dropdown position-absolute end-0 mt-2 bg-white rounded shadow-lg border"
                    style={{ width: '400px', maxHeight: '500px', zIndex: 1050 }}>
                    <div className="dropdown-header p-3 border-bottom d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Notifications</h6>
                        <div>
                            {unreadCount > 0 && (
                                <button
                                    className="btn btn-sm btn-outline-primary me-2"
                                    onClick={markAllAsRead}
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowDropdown(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div className="dropdown-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {loading ? (
                            <div className="text-center p-3">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center p-4 text-muted">
                                <i className="fas fa-bell-slash fa-2x mb-2"></i>
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item p-3 border-bottom ${!notification.is_read ? 'unread' : 'read'} ${notification.type}`}
                                    onClick={() => markAsRead(notification.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-start">
                                        <div className="me-3">
                                            <i className={getNotificationIcon(notification.type)}></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{notification.title}</h6>
                                            <p className="mb-1 small text-muted">{notification.message}</p>
                                            <small className="text-muted">{notification.time_ago} ago</small>
                                        </div>
                                        {!notification.is_read && (
                                            <span className="badge bg-primary ms-2">New</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="dropdown-footer p-2 border-top text-center">
                        <button
                            className="btn btn-sm btn-outline-primary w-100"
                            onClick={() => {
                                setShowDropdown(false);
                                navigate('/notifications');
                            }}
                        >
                            View All Notifications
                        </button>
                    </div>
                </div>
            )}

            {/* Close dropdown when clicking outside */}
            {showDropdown && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100"
                    style={{ zIndex: 1040 }}
                    onClick={() => setShowDropdown(false)}
                ></div>
            )}
        </div>
    );
};

export default NotificationBell;