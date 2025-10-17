// src/components/Security/RouteGuard.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const RouteGuard = ({ children, requiredRole = null }) => {
  const userData = localStorage.getItem('user');
  
  // Redirect to login if not authenticated
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userData);
    
    // If no specific role required, allow access to any authenticated user
    if (!requiredRole) {
      return children;
    }
    
    // Role hierarchy
    const roleHierarchy = {
      'student': 1,
      'teacher': 2,
      'librarian': 3,
      'admin': 4
    };
    
    const userRole = user.user_type;
    
    // Check if user has required role or higher
    if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
      return children;
    }
    
    // Redirect to dashboard if insufficient permissions
    return <Navigate to="/dashboard" replace />;
    
  } catch (error) {
    console.error('Error in RouteGuard:', error);
    return <Navigate to="/login" replace />;
  }
};

export default RouteGuard;