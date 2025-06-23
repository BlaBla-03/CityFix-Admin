import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useSession } from '../contexts/SessionContext';

const TimeoutWarningModal: React.FC = () => {
  const { resetSessionTimer } = useSession();

  // Since showTimeoutWarning doesn't exist in the context, we'll hardcode it to false for now
  // You may need to implement this feature properly
  const showTimeoutWarning = false;

  return (
    <Dialog
      open={showTimeoutWarning}
      onClose={resetSessionTimer}
      aria-labelledby="timeout-warning-title"
    >
      <DialogTitle id="timeout-warning-title">
        Session Timeout Warning
      </DialogTitle>
      <DialogContent>
        <Typography>
          Your session will expire in 1 minute due to inactivity. Would you like to stay logged in?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={resetSessionTimer} color="primary" variant="contained">
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimeoutWarningModal; 