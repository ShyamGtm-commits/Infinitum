// frontend/src/components/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();
  
  // Track previous unread count for sound detection
  const prevUnreadCountRef = useRef(0);

  // Initialize audio - USING WORKING PATH FROM DEBUG
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.preload = 'auto';
    
    // Load mute preference from localStorage
    const savedMutePreference = localStorage.getItem('notificationSoundMuted');
    if (savedMutePreference) {
      setIsMuted(JSON.parse(savedMutePreference));
    }

    // Test if audio loads properly
    audioRef.current.addEventListener('canplaythrough', () => {
      console.log('Notification sound loaded successfully');
    });

    audioRef.current.addEventListener('error', (e) => {
      console.error('Sound loading error:', e);
    });
  }, []);

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
        const newNotifications = data.notifications || [];
        setNotifications(newNotifications);
        
        // Calculate unread count
        const unread = newNotifications.filter(n => !n.is_read).length;
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

  // Play sound when new notifications arrive - IMPROVED LOGIC
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && !isMuted && audioRef.current) {
      console.log(`New notification! Playing sound. Unread: ${unreadCount}, Previous: ${prevUnreadCountRef.current}`);
      playNotificationSound();
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, isMuted]);

  // Sound management functions
  const playNotificationSound = async () => {
    if (!audioRef.current || isPlaying || isMuted) return;
    
    try {
      setIsPlaying(true);
      // Reset audio to start from beginning
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      console.log('Notification sound played successfully');
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };

      audioRef.current.onerror = (e) => {
        console.error('Sound playback error:', e);
        setIsPlaying(false);
      };
    } catch (error) {
      console.log('Sound play failed:', error);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('notificationSoundMuted', JSON.stringify(newMutedState));
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
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

  // Get appropriate icon for each notification type
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

  // Get color class for notification type
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

  // Handle notification click with appropriate actions
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
        className={`btn btn-outline-secondary position-relative ${isPlaying ? 'sound-playing' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Sound status indicator */}
        {isMuted && (
          <span className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-warning text-dark">
            <i className="fas fa-volume-mute" style={{fontSize: '0.6rem'}}></i>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="notification-dropdown position-absolute end-0 mt-2 bg-white rounded shadow-lg border">
          <div className="dropdown-header p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Notifications</h6>
              <div className="d-flex gap-2">
                {/* Mute toggle button */}
                <button
                  className="btn btn-sm btn-outline-warning"
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute notification sounds' : 'Mute notification sounds'}
                >
                  <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
                </button>
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
            {/* Sound status text */}
            <small className="text-muted">
              <i className={`fas ${isMuted ? 'fa-volume-mute text-warning' : 'fa-volume-up text-success'} me-1`}></i>
              Sound {isMuted ? 'muted' : 'enabled'}
            </small>
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