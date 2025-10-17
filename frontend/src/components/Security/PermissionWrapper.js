// src/components/Security/PermissionWrapper.js
import React from 'react';

const PermissionWrapper = ({ children, requiredRole = null, fallback = null }) => {
  // Get user from localStorage
  const userData = localStorage.getItem('user');
  
  if (!userData) {
    return fallback;
  }
  
  try {
    const user = JSON.parse(userData);
    const userRole = user.user_type;
    
    // Role hierarchy - higher number = more permissions
    const roleHierarchy = {
      'student': 1,
      'teacher': 2,
      'librarian': 3,
      'admin': 4
    };
    
    // Check if user has required role or higher
    if (requiredRole && roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
      return children;
    }
    
    // If no specific role required, just check if user exists
    if (!requiredRole) {
      return children;
    }
    
    return fallback;
    
  } catch (error) {
    console.error('Error parsing user data:', error);
    return fallback;
  }
};

export default PermissionWrapper;