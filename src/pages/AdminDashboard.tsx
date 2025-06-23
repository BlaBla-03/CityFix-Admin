import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

interface DashboardStats {
  totalUsers: number;
  adminUsers: number;
  staffUsers: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    adminUsers: 0,
    staffUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(usersQuery);
        
        const stats = {
          totalUsers: snapshot.size,
          adminUsers: 0,
          staffUsers: 0,
        };

        snapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.role === 'admin') {
            stats.adminUsers++;
          } else {
            stats.staffUsers++;
          }
        });

        setStats(stats);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div style={pageContainer}>
        <Navbar />
        <main style={mainContent}>
          <div style={loadingContainer}>Loading dashboard...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageContainer}>
        <Navbar />
        <main style={mainContent}>
          <div style={errorContainer}>
            <h2>Error</h2>
            <p>{error}</p>
            <button
              style={retryButton}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <Navbar />
      
      <main style={mainContent}>
        <h1 style={title}>Admin Dashboard</h1>

        <div style={statsGrid}>
          <div style={statCard}>
            <h3 style={statTitle}>Total Users</h3>
            <p style={statValue}>{stats.totalUsers}</p>
          </div>

          <div style={statCard}>
            <h3 style={statTitle}>Admin Users</h3>
            <p style={statValue}>{stats.adminUsers}</p>
          </div>

          <div style={statCard}>
            <h3 style={statTitle}>Staff Users</h3>
            <p style={statValue}>{stats.staffUsers}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const pageContainer: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
};

const mainContent: React.CSSProperties = {
  padding: '2rem',
  marginTop: '69px', // 64px for navbar + 5px gap
};

const title: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 600,
  color: '#000',
  marginBottom: '2rem',
};

const statsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem',
};

const statCard: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  textAlign: 'center',
};

const statTitle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 500,
  color: '#666',
  marginBottom: '0.5rem',
};

const statValue: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 600,
  color: '#000',
  margin: 0,
};

const loadingContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  color: '#666',
};

const errorContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  color: '#e74c3c',
  textAlign: 'center',
};

const retryButton: React.CSSProperties = {
  backgroundColor: '#3498db',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: '1rem',
  transition: 'background-color 0.2s ease',
};

export default AdminDashboard; 