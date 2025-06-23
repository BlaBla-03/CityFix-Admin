import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rateLimiter } from '../../utils/rateLimiter';
import { getClientInfo } from '../../utils/auditLogger';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export interface LoginFormProps {
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onBlockedUntilChange: (timestamp: number | null) => void;
  onRemainingAttemptsChange: (attempts: number) => void;
}

export const useLoginForm = ({
  onError,
  onLoadingChange,
  onBlockedUntilChange,
  onRemainingAttemptsChange,
}: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError('');

    const clientInfo = getClientInfo();
    if (rateLimiter.isBlocked(clientInfo.ipAddress)) {
      const remainingTime = rateLimiter.getRemainingTime(clientInfo.ipAddress);
      onBlockedUntilChange(Date.now() + remainingTime);
      return;
    }

    onLoadingChange(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      // Verify admin status
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        await auth.signOut();
        throw new Error('Unauthorized access: Admin privileges required');
      }

      // Check if password reset is required
      if (user.metadata.creationTime === user.metadata.lastSignInTime) {
        navigate('/reset-password', { state: { email } });
        return;
      }

      // Reset failed attempts on successful login
      setFailedAttempts(0);
      onRemainingAttemptsChange(5);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      onRemainingAttemptsChange(5 - newFailedAttempts);

      // Apply rate limiting after multiple failures
      if (newFailedAttempts >= 3) {
        rateLimiter.recordAttempt(clientInfo.ipAddress);
        const remainingTime = rateLimiter.getRemainingTime(clientInfo.ipAddress);
        onBlockedUntilChange(Date.now() + remainingTime);
      }

      // Handle specific error cases
      switch (error.code) {
        case 'auth/invalid-email':
          onError('Please enter a valid admin email address');
          break;
        case 'auth/user-disabled':
          onError('This admin account has been disabled. Please contact system administrator.');
          break;
        case 'auth/user-not-found':
          onError('No admin account found with this email address');
          break;
        case 'auth/wrong-password':
          onError('Incorrect password. Please try again.');
          break;
        default:
          if (error.message.includes('Unauthorized access')) {
            onError('Unauthorized access: Admin privileges required');
          } else {
            onError('An error occurred during login. Please try again.');
          }
      }
    } finally {
      onLoadingChange(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    failedAttempts,
    handleSubmit,
  };
}; 