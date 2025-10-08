// Navbar.js (Updated - hide user-specific links for admins)
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import NotificationBell from './NotificationBell';

const Navbar = ({ user, onLogout }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const closeSidebar = () => {
    setIsSidebarVisible(false);
  };

  return (
    <>
      {/* Horizontal navbar */}
      <nav className="horizontal-navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <i className="fas fa-bars"></i>
            </button>
            <Link to="/" className="brand-link">
              <i className="fas fa-book-open"></i>
              <span className="brand-text">Infinitum Library</span>
            </Link>
          </div>
          
          {user && (
            <div className="nav-user-section">
              <NotificationBell user={user} />
              <div className="user-info">
                {/* ... existing user info code ... */}
              </div>
            </div>
          )}
          
          {/* Auth options - only shown when not logged in */}
          {!user && (
            <div className="nav-auth-options">
              <Link to="/login" className="auth-btn login-btn">
                <i className="fas fa-key"></i>
                <span>Login</span>
              </Link>
              <Link to="/register" className="auth-btn register-btn">
                <i className="fas fa-user-plus"></i>
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* User info - shown when logged in */}
          {user && (
            <div className="nav-user-section">
              <div className="user-info">
                <div className="user-avatar">
                  <i className="fas fa-user"></i>
                </div>

                {/* Only show user-specific links for non-admin users */}
                {user.user_type !== 'admin' && (
                  <>
                    <li className="nav-item">
                      <Link to="/my-transactions" className="nav-link" onClick={closeSidebar}>
                        <i className="fas fa-history"></i>
                        <span>My Transactions</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/my-borrows" className="nav-link" onClick={closeSidebar}>
                        <i className="fas fa-book"></i>
                        <span>My Borrows</span>
                      </Link>
                    </li>
                  </>
                )}

                <div className="user-details">
                  <span className="username">{user.username}</span>
                  <span className="user-role">{user.user_type}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Vertical sidebar */}
      <nav className={`vertical-sidebar ${isSidebarVisible ? 'visible' : 'hidden'}`}>
        <div className="sidebar-content">
          {/* Close button for sidebar */}
          <div className="sidebar-header">
            <button className="sidebar-close" onClick={closeSidebar}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* User info in sidebar */}
          {user && (
            <div className="sidebar-user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-details">
                <span className="username">{user.username}</span>
                <span className="user-role">{user.user_type}</span>
                <div className="user-status">
                  <i className="fas fa-circle online-indicator"></i>
                  <span>Online</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation links */}
          <ul className="sidebar-nav-links">
            {user ? (
              <>
                <li className="nav-item">
                  <Link to="/dashboard" className="nav-link" onClick={closeSidebar}>
                    <i className="fas fa-home"></i>
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/books" className="nav-link" onClick={closeSidebar}>
                    <i className="fas fa-book"></i>
                    <span>Browse Books</span>
                  </Link>
                </li>
                {/* Librarian Links */}
                {user && (user.user_type === 'admin' || user.user_type === 'librarian') && (
                  <li className="nav-item">
                    <Link to="/librarian" className="nav-link" onClick={closeSidebar}>
                      <i className="fas fa-clipboard-list me-2"></i>
                      <span>Librarian Dashboard</span>
                    </Link>
                  </li>
                )}
                {user.user_type === 'admin' && (
                  <li className="nav-item">
                    <Link to="/admin" className="nav-link" onClick={closeSidebar}>
                      <i className="fas fa-crown"></i>
                      <span>Admin Panel</span>
                    </Link>
                  </li>
                )}

                {/* Only show user-specific links for non-admin users */}
                {user.user_type !== 'admin' && (
                  <>
                    <li className="nav-item">
                      <Link to="/fines" className="nav-link" onClick={closeSidebar}>
                        <i className="fas fa-coins"></i>
                        <span>Fines & Payments</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/history" className="nav-link" onClick={closeSidebar}>
                        <i className="fas fa-history"></i>
                        <span>Reading History</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/recommendations" className="nav-link" onClick={closeSidebar}>
                        <i className="fas fa-star"></i>
                        <span>Recommendations</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/my-transactions" className="nav-link" onClick={closeSidebar}>
                        <i className="fas fa-history"></i>
                        <span>My Transactions</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/my-borrows" className="nav-link" onClick={closeSidebar}>
                        <i className="fas fa-book"></i>
                        <span>My Borrows</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/popular-books" className="nav-link" onClick={closeSidebar}>
                        <i className="fas fa-fire me-2"></i>
                        <span>Popular Books</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/reading-dashboard" className="nav-link" onClick={closeSidebar}>
                        <i className="fas fa-chart-line me-2"></i>
                        <span>Reading Dashboard</span>
                      </Link>
                    </li>
                  </>
                )}
              </>
            ) : (
              <li className="nav-item">
                <Link to="/team" className="nav-link" onClick={closeSidebar}>
                  <i className="fas fa-users"></i>
                  <span>Our Team</span>
                </Link>
              </li>
            )}
          </ul>

          {/* Logout button for logged in users */}
          {user && (
            <div className="sidebar-auth">
              <button className="logout-btn" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Overlay for mobile when sidebar is visible */}
      <div
        className={`sidebar-overlay ${isSidebarVisible ? 'visible' : ''}`}
        onClick={closeSidebar}
      ></div>
    </>
  );
};

export default Navbar;