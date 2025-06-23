import React, { useState, useEffect, useRef } from 'react';
import { Typography, CircularProgress, Alert, Box } from '@mui/material';
import { useLoginForm } from '../components/auth/LoginForm';
import { StyledTextField, StyledButton, LoginContainer, LoginPaper, LogoContainer } from '../components/auth/LoginStyles';
import { PasswordField } from '../components/auth/PasswordField';
import { SessionTimeoutModal } from '../components/SessionTimeoutModal';
import { rateLimiter } from '../utils/rateLimiter';
import { getClientInfo } from '../utils/auditLogger';

const AdminLogin: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const {
    email,
    setEmail,
    password,
    setPassword,
    handleSubmit,
  } = useLoginForm({
    onError: setError,
    onLoadingChange: setLoading,
    onBlockedUntilChange: setBlockedUntil,
    onRemainingAttemptsChange: () => {},
  });

  useEffect(() => {
    // Auto-focus email input on mount
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const checkRateLimit = () => {
      const clientInfo = getClientInfo();
      const isBlocked = rateLimiter.isBlocked(clientInfo.ipAddress);
      if (isBlocked) {
        const remainingTime = rateLimiter.getRemainingTime(clientInfo.ipAddress);
        setBlockedUntil(Date.now() + remainingTime);
      }
    };

    checkRateLimit();
    const interval = setInterval(checkRateLimit, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !loading && blockedUntil === null) {
      handleSubmit(event);
    }
  };

  return (
    <LoginContainer>
      <LoginPaper elevation={3}>
        <LogoContainer>
          <img
            src="https://img.icons8.com/ios-filled/50/000000/map.png"
            alt="logo"
            style={{ height: '40px', width: '40px' }}
          />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            <strong>City</strong>Fix Admin
          </Typography>
        </LogoContainer>

        <form onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
          <StyledTextField
            inputRef={emailInputRef}
            label="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            disabled={loading || blockedUntil !== null}
            sx={{ marginBottom: '1rem' }}
            autoComplete="email"
            error={error.includes('email')}
            helperText={error.includes('email') ? error : ''}
          />

          <Box sx={{ marginBottom: '1.5rem' }}>
            <PasswordField
              value={password}
              onChange={setPassword}
              disabled={loading || blockedUntil !== null}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              error={error.includes('password')}
              helperText={error.includes('password') ? error : ''}
            />
          </Box>

          {error && !error.includes('email') && !error.includes('password') && (
            <Alert severity="error" sx={{ marginBottom: '1rem' }}>
              {error}
            </Alert>
          )}

          {blockedUntil && (
            <Alert severity="warning" sx={{ marginBottom: '1rem' }}>
              Account temporarily locked. Please try again in {formatTimeRemaining(blockedUntil - Date.now())}
            </Alert>
          )}

          <StyledButton
            type="submit"
            variant="contained"
            disabled={loading || blockedUntil !== null}
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
                <span style={{ visibility: 'hidden' }}>Sign In</span>
              </>
            ) : (
              'Sign In'
            )}
          </StyledButton>
        </form>
      </LoginPaper>
      <SessionTimeoutModal />
    </LoginContainer>
  );
};

export default AdminLogin; 