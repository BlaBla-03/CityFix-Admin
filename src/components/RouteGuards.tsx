import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

interface RouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<RouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  // Show loading screen while checking auth state
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  // Allow access if authenticated
  return <>{children}</>;
};

export const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  // Show loading screen while checking auth state
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Redirect to dashboard if already authenticated
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Allow access if not authenticated
  return <>{children}</>;
}; 