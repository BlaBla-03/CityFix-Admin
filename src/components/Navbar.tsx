import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { styled } from '@mui/material/styles';
import { AppBar, Toolbar, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocationCity as MunicipalIcon,
  Assignment as IncidentTypeIcon,
  Logout as LogoutIcon,
  VerifiedUser as TrustIcon,
} from '@mui/icons-material';

const NavButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isActive'
})<{ isActive: boolean }>(({ isActive }) => ({
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  backgroundColor: isActive ? '#2ecc71' : 'transparent',
  color: isActive ? '#fff' : '#666',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  '&:hover': {
    backgroundColor: isActive ? '#27ae60' : '#f5f5f5',
  },
}));

const LogoutBtn = styled(Button)({
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  backgroundColor: '#e74c3c',
  color: '#fff',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  '&:hover': {
    backgroundColor: '#c0392b',
  },
});

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: '#ffffff', 
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '& .MuiToolbar-root': {
            minHeight: '48px',
            padding: '0 16px'
          }
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img
              src="https://img.icons8.com/ios-filled/50/000000/map.png"
              alt="logo"
              style={{ height: '32px', width: '32px' }}
            />
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#000' }}>
              <strong>City</strong>Fix
            </span>
          </Box>

          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <NavButton isActive={isActive('/dashboard')} onClick={() => navigate('/dashboard')}>
              <DashboardIcon fontSize="small" /> Dashboard
            </NavButton>
            <NavButton isActive={isActive('/users')} onClick={() => navigate('/users')}>
              <PeopleIcon fontSize="small" /> Users
            </NavButton>
            <NavButton isActive={isActive('/municipals')} onClick={() => navigate('/municipals')}>
              <MunicipalIcon fontSize="small" /> Municipals
            </NavButton>
            <NavButton isActive={isActive('/incident-types')} onClick={() => navigate('/incident-types')}>
              <IncidentTypeIcon fontSize="small" /> Incident Types
            </NavButton>
            <NavButton isActive={isActive('/trust-management')} onClick={() => navigate('/trust-management')}>
              <TrustIcon fontSize="small" /> Trust Management
            </NavButton>
          </Box>

          <Box>
            <LogoutBtn onClick={() => setShowLogoutConfirm(true)}>
              <LogoutIcon fontSize="small" /> Logout
            </LogoutBtn>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        aria-labelledby="logout-confirm-title"
      >
        <DialogTitle id="logout-confirm-title">
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to logout? Any unsaved changes will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutConfirm(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar; 