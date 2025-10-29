// frontend/src/components/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const audioRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/notifications/?limit=5', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        
        // Calculate unread count
        const unread = data.notifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/read/`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
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
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // NEW: Get appropriate icon for each notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      // Reservation notifications
      case 'reservation_confirmation':
        return '📋';
      case 'reservation_ready':
        return '✅';
      case 'reservation_expiring':
        return '⏰';
      case 'pickup_reminder':
        return '📚';
      
      // Existing notifications
      case 'book_available':
        return '🎉';
      case 'due_reminder':
        return '📅';
      case 'overdue':
        return '⚠️';
      case 'fine':
        return '💰';
      case 'achievement':
        return '🏆';
      case 'system':
        return '🔔';
      case 'welcome':
        return '👋';
      default:
        return '📢';
    }
  };

  // NEW: Get color class for notification type
  const getNotificationColor = (type) => {
    const colors = {
      // Reservation notifications
      reservation_confirmation: 'text-success',
      reservation_ready: 'text-success',
      reservation_expiring: 'text-warning',
      pickup_reminder: 'text-info',
      
      // Existing notifications
      book_available: 'text-success',
      due_reminder: 'text-warning',
      overdue: 'text-danger',
      fine: 'text-danger',
      achievement: 'text-success',
      system: 'text-primary',
      welcome: 'text-info'
    };
    return colors[type] || 'text-secondary';
  };

  // NEW: Handle notification click with appropriate actions
  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Handle different actions based on notification type
    switch (notification.type) {
      case 'reservation_confirmation':
      case 'reservation_ready':
      case 'pickup_reminder':
        // Navigate to book detail to generate/show QR
        if (notification.related_book_id) {
          navigate(`/books/${notification.related_book_id}`);
        } else {
          navigate('/my-reservations');
        }
        break;
      
      case 'reservation_expiring':
        // Navigate to book detail to renew QR
        if (notification.related_book_id) {
          navigate(`/books/${notification.related_book_id}`);
        }
        break;
      
      case 'book_available':
        // Navigate to book detail to reserve
        if (notification.related_book_id) {
          navigate(`/books/${notification.related_book_id}`);
        }
        break;
      
      case 'due_reminder':
      case 'overdue':
        navigate('/my-borrows');
        break;
      
      case 'fine':
        navigate('/fines');
        break;
      
      case 'achievement':
        navigate('/achievements');
        break;
      
      default:
        // Use action_url if provided, otherwise do nothing
        if (notification.action_url) {
          navigate(notification.action_url);
        }
    }
    
    setShowDropdown(false);
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="notification-bell position-relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        className="btn btn-outline-secondary position-relative"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="notification-dropdown position-absolute end-0 mt-2 bg-white rounded shadow-lg border">
          <div className="dropdown-header p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Notifications</h6>
              {unreadCount > 0 && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="dropdown-body" style={{ maxHeight: '400px', overflowY: 'auto', width: '350px' }}>
            {loading ? (
              <div className="text-center p-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-3 text-muted">
                <i className="fas fa-bell-slash fa-2x mb-2"></i>
                <p className="mb-0">No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item p-3 border-bottom ${
                    !notification.is_read ? 'bg-light' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="d-flex align-items-start">
                    <span className={`me-2 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="mb-1 small fw-bold">{notification.title}</h6>
                        {!notification.is_read && (
                          <span className="badge bg-primary badge-sm">New</span>
                        )}
                      </div>
                      <p className="mb-1 small text-muted">{notification.message}</p>
                      <small className="text-muted">
                        {formatTimeAgo(notification.created_at)}
                        {notification.related_book_title && ` • ${notification.related_book_title}`}
                      </small>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="dropdown-footer p-2 border-top text-center">
            <button
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => {
                navigate('/notifications');
                setShowDropdown(false);
              }}
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;