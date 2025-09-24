import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('ProtectedRoute: Auth state', { 
    isAuthenticated, 
    isLoading, 
    userAddress: user?.address,
    timestamp: new Date().toISOString()
  });

  // Only show loader if we're actually loading
  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loader');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
