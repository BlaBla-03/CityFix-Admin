import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import { useSession } from '../contexts/SessionContext';

const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_THRESHOLD = 1 * 60 * 1000; // 1 minute

export const SessionTimeoutModal: React.FC = () => {
  const { remainingTime, resetSessionTimer, isSessionValid } = useSession();
  const [open, setOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!isSessionValid) {
      setOpen(false);
      return;
    }

    if (remainingTime <= WARNING_THRESHOLD && remainingTime > 0) {
      setOpen(true);
      // Enable auto-refresh when less than 1 minute remaining
      if (remainingTime <= AUTO_REFRESH_THRESHOLD) {
        setAutoRefresh(true);
      }
    } else {
      setOpen(false);
      setAutoRefresh(false);
    }
  }, [remainingTime, isSessionValid]);

  // Auto-refresh session when time is running low
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      resetSessionTimer();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, resetSessionTimer]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = (remainingTime / WARNING_THRESHOLD) * 100;

  const handleContinue = () => {
    resetSessionTimer();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      aria-labelledby="session-timeout-dialog-title"
      aria-describedby="session-timeout-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="session-timeout-dialog-title">
        Session Timeout Warning
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography id="session-timeout-dialog-description" gutterBottom>
            Your session will expire in {formatTime(remainingTime)}. Would you like to continue your session?
          </Typography>
          {autoRefresh && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
              Auto-refresh enabled to keep your session active
            </Typography>
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
            },
          }}
          color={progress < 30 ? 'error' : 'warning'}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleContinue}
          color="primary"
          variant="contained"
          autoFocus
          size="large"
          fullWidth
        >
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 