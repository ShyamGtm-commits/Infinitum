import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import BookList from './components/Booklist';
import Fines from './components/Fines';
import AdminDashboard from './components/AdminDashboard';



// Main App component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Call logout API
    fetch('http://localhost:8000/api/logout/', {
      method: 'POST',
      credentials: 'include',
    });
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container mt-4">
          <Routes>
            <Route
              path="/"
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/" /> : <Register />}
            />
            <Route
              path="/books"
              element={user ? <BookList user={user} /> : <Navigate to="/login" />} />

            <Route
              path="/fines"
              element={user ? <Fines user={user} /> : <Navigate to="/login" />}
            />

            <Route
              path="/admin"
              element={user && user.user_type === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/" />}
            />

          </Routes>



        </div>
      </div>
    </Router>
  );
}

export default App;