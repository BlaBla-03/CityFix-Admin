import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { logAuditEvent, AuditEventType, getClientInfo } from '../utils/auditLogger';

interface SessionContextType {
  resetSessionTimer: () => void;
  remainingTime: number;
  isSessionValid: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_KEY = 'cityfix_session';

interface SessionData {
  lastActivity: number;
  userId: string;
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lastActivity, setLastActivity] = useState(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      const sessionData: SessionData = JSON.parse(savedSession);
      return sessionData.lastActivity;
    }
    return Date.now();
  });
  const [remainingTime, setRemainingTime] = useState(SESSION_TIMEOUT);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const resetSessionTimer = () => {
    const now = Date.now();
    setLastActivity(now);
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        lastActivity: now,
        userId: currentUser.uid
      }));
    }
  };

  // Handle browser/server restart
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      const sessionData: SessionData = JSON.parse(savedSession);
      const timeSinceLastActivity = Date.now() - sessionData.lastActivity;

      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        // Session expired
        localStorage.removeItem(SESSION_KEY);
        setIsSessionValid(false);
        if (currentUser) {
          logAuditEvent({
            eventType: AuditEventType.SESSION_TIMEOUT,
            userId: currentUser.uid,
            userEmail: currentUser.email || undefined,
            details: 'Session expired due to inactivity',
            ...getClientInfo()
          });
          logout();
          navigate('/login');
        }
      } else {
        // Session still valid
        setLastActivity(sessionData.lastActivity);
        setIsSessionValid(true);
      }
    }
  }, [currentUser, logout, navigate]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    const handleUserActivity = () => {
      resetSessionTimer();
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Handle browser close/tab close
    const handleBeforeUnload = () => {
      resetSessionTimer();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const checkSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const newRemainingTime = SESSION_TIMEOUT - timeSinceLastActivity;

      setRemainingTime(newRemainingTime);

      if (newRemainingTime <= 0) {
        // Session expired
        localStorage.removeItem(SESSION_KEY);
        setIsSessionValid(false);
        logAuditEvent({
          eventType: AuditEventType.SESSION_TIMEOUT,
          userId: currentUser.uid,
          userEmail: currentUser.email || undefined,
          details: 'Session expired due to inactivity',
          ...getClientInfo()
        });
        logout();
        navigate('/login');
      }
    };

    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, [currentUser, lastActivity, logout, navigate]);

  return (
    <SessionContext.Provider value={{ resetSessionTimer, remainingTime, isSessionValid }}>
      {children}
    </SessionContext.Provider>
  );
}; 