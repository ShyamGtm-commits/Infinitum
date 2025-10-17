import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';
import Team from './components/Team';
import VintageLandingPage from './components/VintageLandingPage';
import Navbar from './components/Navbar';
import Login from './components/Login';

import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import Fines from './components/Fines';
import AdminDashboard from './components/AdminDashboard';
import UserTransactions from './components/UserTransactions';
import ActiveBorrows from './components/ActiveBorrows';
import Recommendations from './components/Recommendations'; // Import the Recommendations component
import LibrarianDashboard from './components/LibrarianDashboard';
import BookDetail from './components/BookDetail';
import MultiStepRegister from './components/MultiStepRegister';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import PopularBooks from './components/PopularBooks';
import ReadingDashboard from './components/ReadingDashboard';
import NotificationsPage from './components/NotificationsPage';
import NotificationPreferences from './components/NotificationPreferences';
import RouteGuard from './components/Security/RouteGuard';
import SecurityDashboard from './components/Admin/SecurityDashboard';

// import PermissionWrapper from './components/Security/PermissionWrapper';


// Create a wrapper component to access the location
function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    fetch('http://localhost:8000/api/logout/', {
      method: 'POST',
      credentials: 'include',
    });
  };

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        await fetch('http://localhost:8000/api/csrf/', {
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCsrfToken();

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  // Don't show navbar on landing page when not logged in
  const showNavbar = user || location.pathname !== '/';

  return (
    <div className="App">
      {showNavbar && <Navbar user={user} onLogout={handleLogout} />}

      <Routes>
        <Route path="/" element={<VintageLandingPage />} />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
        />

        <Route
          path="/books"
          element={user ? <BookList user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/fines"
          element={user ? <Fines user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={
            user && user.user_type === 'admin' ? (
              <AdminDashboard user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/team"
          element={<Team />}
        />
        <Route
          path="/my-borrows"
          element={user ? <ActiveBorrows user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-transactions"
          element={user ? <UserTransactions user={user} /> : <Navigate to="/login" />}
        />
        {/* Add the Recommendations route */}
        <Route
          path="/recommendations"
          element={user ? <Recommendations user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/librarian"
          element={
            user && (user.user_type === 'admin' || user.user_type === 'librarian') ? (
              <LibrarianDashboard user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/books/:id"
          element={user ? <BookDetail user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <MultiStepRegister />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/popular-books" element={<PopularBooks user={user} />} />
        <Route
          path="/reading-dashboard"
          element={user ? <ReadingDashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/notifications"
          element={user ? <NotificationsPage user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/notifications/preferences"
          element={user ? <NotificationPreferences user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={
            <RouteGuard requiredRole="admin">
              <AdminDashboard user={user} />
            </RouteGuard>
          }
        />

        <Route
          path="/librarian"
          element={
            <RouteGuard requiredRole="librarian">
              <LibrarianDashboard user={user} />
            </RouteGuard>
          }
        />
        <Route
          path="/admin/security"
          element={
            <RouteGuard requiredRole="admin">
              <SecurityDashboard user={user} />
            </RouteGuard>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;