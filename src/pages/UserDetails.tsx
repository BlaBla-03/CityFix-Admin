import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  location: string;
  municipal: string;
  role: string;
  createdAt: any;
  updatedAt?: any;
  tempPassword?: string;
}

const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!id) return;
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as UserData);
        } else {
          setError('User not found');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Error fetching user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div style={pageContainer}>
        <main style={mainContent}>
          <div style={loadingContainer}>Loading user data...</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={pageContainer}>
        <main style={mainContent}>
          <div style={errorContainer}>
            <p style={errorText}>{error || 'User not found'}</p>
            <button
              style={backButton}
              onClick={() => navigate('/users')}
            >
              Back to Users
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <main style={mainContent}>
        <div style={backButtonContainer}>
          <button
            style={backButton}
            onClick={() => navigate('/users')}
          >
            Back to Users
          </button>
        </div>

        <div style={contentContainer}>
          <div style={card}>
            <div style={header}>
              <h2 style={title}>User Details</h2>
              <div style={actions}>
                <button
                  style={editButton}
                  onClick={() => navigate(`/users/${id}/edit`)}
                >
                  Edit User
                </button>
              </div>
            </div>

            {error && <p style={errorText}>{error}</p>}

            <div style={details}>
              <div style={detailRow}>
                <span style={label}>Name:</span>
                <span style={value}>{user.name}</span>
              </div>
              <div style={detailRow}>
                <span style={label}>Username:</span>
                <span style={value}>@{user.username}</span>
              </div>
              <div style={detailRow}>
                <span style={label}>Email:</span>
                <span style={value}>{user.email}</span>
              </div>
              <div style={detailRow}>
                <span style={label}>Location:</span>
                <span style={value}>{user.location}</span>
              </div>
              <div style={detailRow}>
                <span style={label}>Municipal:</span>
                <span style={value}>{user.municipal}</span>
              </div>
              <div style={detailRow}>
                <span style={label}>Role:</span>
                <span style={roleBadge(user.role)}>{user.role}</span>
              </div>
              <div style={detailRow}>
                <span style={label}>Created:</span>
                <span style={value}>
                  {user.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
              {user.updatedAt && (
                <div style={detailRow}>
                  <span style={label}>Last Updated:</span>
                  <span style={value}>
                    {user.updatedAt.toDate().toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
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
  marginTop: '69px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const card: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
};

const title: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 600,
  color: '#000',
  margin: 0,
};

const actions: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

const editButton: React.CSSProperties = {
  backgroundColor: '#3498db',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const details: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const detailRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
};

const label: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#666',
};

const value: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#000',
};

const roleBadge = (role: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: role === 'admin' ? '#e74c3c' : '#3498db',
  color: '#fff',
});

const errorText: React.CSSProperties = {
  color: '#e74c3c',
  fontSize: '0.875rem',
  marginBottom: '1rem',
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
  gap: '1rem',
  padding: '2rem',
};

const backButtonContainer: React.CSSProperties = {
  alignSelf: 'flex-start',
  marginBottom: '1rem',
  width: '100%',
  maxWidth: '600px',
};

const backButton: React.CSSProperties = {
  backgroundColor: '#95a5a6',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const contentContainer: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
};

const tempPasswordContainer: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  border: '1px solid #e9ecef',
};

const tempPasswordText: React.CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  color: '#666',
};

const tempPasswordNote: React.CSSProperties = {
  margin: '0.5rem 0 0 0',
  fontSize: '0.75rem',
  color: '#999',
};

export default UserDetails; 