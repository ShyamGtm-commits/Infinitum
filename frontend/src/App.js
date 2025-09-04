import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';
import Team from './components/Team';
import VintageLandingPage from './components/VintageLandingPage';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import BookList from './components/BookList';
import Fines from './components/Fines';
import AdminDashboard from './components/AdminDashboard';
import UserTransactions from './components/UserTransactions';

import ActiveBorrows from './components/ActiveBorrows';

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
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <Register />}
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
        <Route path="/my-borrows" element={<ActiveBorrows user={user} />} />
        <Route path="/my-transactions" element={<UserTransactions user={user} />} />
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