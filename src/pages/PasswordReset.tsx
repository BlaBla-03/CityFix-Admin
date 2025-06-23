import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Alert, IconButton, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';
import { getAuth, updatePassword } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logAuditEvent, AuditEventType, getClientInfo } from '../utils/auditLogger';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: '#2ecc71',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2ecc71',
    },
  },
});

const StyledButton = styled(Button)({
  backgroundColor: '#2ecc71',
  '&:hover': {
    backgroundColor: '#27ae60',
  },
  '&.Mui-disabled': {
    backgroundColor: '#95a5a6',
  },
});

const PasswordReset: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user needs password reset
    const checkPasswordReset = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || !userDoc.data().requiresPasswordSetup) {
        navigate('/dashboard');
      }
    };

    checkPasswordReset();
  }, [navigate, auth]);

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordRequirements(requirements);
    return Object.values(requirements).every(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(newPassword)) {
      setError('Password does not meet all requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Update password in Firebase Auth
      await updatePassword(user, newPassword);

      // Update user document in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        requiresPasswordSetup: false,
        tempPassword: null,
      });

      // Log the password change
      await logAuditEvent({
        eventType: AuditEventType.PASSWORD_CHANGE,
        userEmail: user.email || '',
        ...getClientInfo()
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '1rem',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h5" component="h1" sx={{ marginBottom: '2rem', textAlign: 'center' }}>
          Create New Password
        </Typography>

        <form onSubmit={handleSubmit}>
          <StyledTextField
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              validatePassword(e.target.value);
            }}
            required
            fullWidth
            disabled={loading}
            sx={{ marginBottom: '1rem' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle new password visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <StyledTextField
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
            disabled={loading}
            sx={{ marginBottom: '1rem' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ marginBottom: '1rem' }}>
            <Typography variant="subtitle2" sx={{ marginBottom: '0.5rem' }}>
              Password Requirements:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li style={{ color: passwordRequirements.length ? '#2ecc71' : '#666' }}>
                At least 8 characters long
              </li>
              <li style={{ color: passwordRequirements.uppercase ? '#2ecc71' : '#666' }}>
                Contains uppercase letter
              </li>
              <li style={{ color: passwordRequirements.lowercase ? '#2ecc71' : '#666' }}>
                Contains lowercase letter
              </li>
              <li style={{ color: passwordRequirements.number ? '#2ecc71' : '#666' }}>
                Contains number
              </li>
              <li style={{ color: passwordRequirements.special ? '#2ecc71' : '#666' }}>
                Contains special character
              </li>
            </ul>
          </Box>

          {error && (
            <Alert severity="error" sx={{ marginBottom: '1rem' }}>
              {error}
            </Alert>
          )}

          <StyledButton
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{ padding: '0.75rem', position: 'relative' }}
          >
            {loading ? (
              <>
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'white',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px',
                  }}
                />
                <span style={{ visibility: 'hidden' }}>Update Password</span>
              </>
            ) : (
              'Update Password'
            )}
          </StyledButton>
        </form>
      </Paper>
    </Box>
  );
};

export default PasswordReset; 