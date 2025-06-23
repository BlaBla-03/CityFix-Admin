import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import AdminLogin from './pages/AdminLogin';
import ManageUsers from './pages/ManageUsers';
import AddUser from './pages/AddUser';
import EditUser from './pages/EditUser';
import UserDetails from './pages/UserDetails';
import AdminDashboard from './pages/AdminDashboard';
import MunicipalList from './pages/MunicipalList';
import AddMunicipal from './pages/AddMunicipal';
import MunicipalDetails from './pages/MunicipalDetails';
import EditMunicipal from './pages/EditMunicipal';
import IncidentTypeList from './pages/IncidentTypeList';
import AddIncidentType from './pages/AddIncidentType';
import EditIncidentType from './pages/EditIncidentType';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import TimeoutWarningModal from './components/TimeoutWarningModal';
import PasswordReset from './pages/PasswordReset';
import TrustManagement from './pages/TrustManagement';
import { PrivateRoute, PublicRoute } from './components/RouteGuards';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#45B7AF',
    },
    secondary: {
      main: '#FF4B4B',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f5f5f5',
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <SessionProvider>
            <Routes>
              <Route path="/" element={<PublicRoute><AdminLogin /></PublicRoute>} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/password-reset" element={<PublicRoute><PasswordReset /></PublicRoute>} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/users" 
                element={
                  <PrivateRoute>
                    <ManageUsers />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/users/:id" 
                element={
                  <PrivateRoute>
                    <UserDetails />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/users/new" 
                element={
                  <PrivateRoute>
                    <AddUser />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/users/:id/edit" 
                element={
                  <PrivateRoute>
                    <EditUser />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/municipals" 
                element={
                  <PrivateRoute>
                    <MunicipalList />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/municipals/new" 
                element={
                  <PrivateRoute>
                    <AddMunicipal />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/municipals/:id" 
                element={
                  <PrivateRoute>
                    <MunicipalDetails />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/municipals/:id/edit" 
                element={
                  <PrivateRoute>
                    <EditMunicipal />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/incident-types" 
                element={
                  <PrivateRoute>
                    <IncidentTypeList />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/incident-types/add" 
                element={
                  <PrivateRoute>
                    <AddIncidentType />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/incident-types/edit/:id" 
                element={
                  <PrivateRoute>
                    <EditIncidentType />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/trust-management" 
                element={
                  <PrivateRoute>
                    <TrustManagement />
                  </PrivateRoute>
                } 
              />
            </Routes>
            <TimeoutWarningModal />
          </SessionProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
