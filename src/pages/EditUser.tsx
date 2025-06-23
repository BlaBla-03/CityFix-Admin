import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import Navbar from '../components/Navbar';

interface Municipal {
  id: string;
  name: string;
  location: string;
}

const EditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({
    name: '',
    email: '',
    location: '',
    municipal: '',
    role: 'staff',
  });
  const [municipals, setMunicipals] = useState<Municipal[]>([]);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        if (!id) return;
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setForm({
            name: userData.name || '',
            email: userData.email || '',
            location: userData.location || '',
            municipal: userData.municipal || '',
            role: userData.role || 'staff',
          });
          if (userData.tempPassword) {
            setTempPassword(userData.tempPassword);
          }
        }

        // Fetch municipals
        const q = collection(db, 'municipals');
        const snapshot = await getDocs(q);
        const municipalList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Municipal[];
        setMunicipals(municipalList);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error fetching user data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!id) throw new Error('No user ID provided');

      await updateDoc(doc(db, 'users', id), {
        name: form.name,
        email: form.email,
        location: form.location,
        municipal: form.municipal,
        role: form.role,
        updatedAt: new Date(),
      });

      alert('User updated successfully!');
      navigate('/users');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!id) return;
    setError('');
    setLoading(true);

    try {
      // Ensure the user is authenticated
      const user = auth.currentUser;
      if (!user) throw new Error('You must be signed in to reset a password.');
      const userToken = await user.getIdToken();

      // Generate a random password
      const newPassword = Math.random().toString(36).slice(-8);
      
      // Get the user's email from Firestore
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) throw new Error('User not found');
      
      // Call the HTTP Cloud Function to update the password
      const response = await fetch('https://us-central1-city-fix-62029.cloudfunctions.net/updateUserPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + userToken
        },
        body: JSON.stringify({
          userId: id,
          newPassword: newPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', id), {
        tempPassword: newPassword,
        requiresPasswordSetup: true,
        updatedAt: new Date(),
      });

      setTempPassword(newPassword);
      setShowResetConfirm(false);
      alert('Password has been reset successfully!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      const token = await user.getIdToken();
      const response = await fetch('https://us-central1-city-fix-62029.cloudfunctions.net/deleteUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      alert('User deleted successfully!');
      navigate('/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={pageContainer}>
        <Navbar />
        <main style={mainContent}>
          <div style={loadingContainer}>Loading user data...</div>
        </main>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <Navbar />
      
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
            <h2 style={title}>Edit User</h2>
            
            {error && <p style={errorText}>{error}</p>}
            
            {tempPassword && (
              <div style={tempPasswordContainer}>
                <p style={tempPasswordText}>
                  Temporary password: <strong>{tempPassword}</strong>
                </p>
                <p style={tempPasswordNote}>
                  This is the temporary password set for this user. The user will need to change it on their next login.
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={inputGroup}>
                <label style={label}>Full Name</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  style={input}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div style={inputGroup}>
                <label style={label}>Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  style={input}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div style={inputGroup}>
                <label style={label}>Location</label>
                <input
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  style={input}
                  placeholder="Enter location"
                  required
                />
              </div>

              <div style={inputGroup}>
                <label style={label}>Municipal</label>
                <select
                  name="municipal"
                  value={form.municipal}
                  onChange={handleChange}
                  style={input}
                  required
                >
                  <option value="">Select a municipal</option>
                  {municipals.map((municipal) => (
                    <option key={municipal.id} value={municipal.name}>
                      {municipal.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={inputGroup}>
                <label style={label}>Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  style={input}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={buttonGroup}>
                <button
                  type="submit"
                  style={submitButton}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  style={cancelButton}
                  onClick={() => navigate('/users')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>

              <div style={actionButtonsContainer}>
                <button
                  type="button"
                  style={resetButton}
                  onClick={() => setShowResetConfirm(true)}
                  disabled={loading}
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  style={deleteButton}
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                >
                  Delete User
                </button>
              </div>
            </form>
          </div>
        </div>

        {showConfirm && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this user? This action cannot be undone.</p>
              <div style={modalButtons}>
                <button
                  style={confirmDeleteButton}
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  style={cancelButton}
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showResetConfirm && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>Confirm Password Reset</h3>
              <p>Are you sure you want to reset this user's password? A new temporary password will be generated.</p>
              <div style={modalButtons}>
                <button
                  style={confirmResetButton}
                  onClick={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  style={cancelButton}
                  onClick={() => setShowResetConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
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

const backButtonContainer: React.CSSProperties = {
  alignSelf: 'flex-start',
  marginBottom: '1rem',
  width: '100%',
  maxWidth: '1200px',
};

const contentContainer: React.CSSProperties = {
  width: '100%',
  maxWidth: '1200px',
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

const title: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 600,
  color: '#000',
  marginBottom: '2rem',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const inputGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const label: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#666',
};

const input: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
  transition: 'border-color 0.2s ease',
};

const buttonGroup: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginTop: '1rem',
};

const submitButton: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#2ecc71',
  color: '#fff',
  padding: '0.75rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const deleteButton: React.CSSProperties = {
  backgroundColor: '#e74c3c',
  color: '#fff',
  padding: '0.75rem 2rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const cancelButton: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#95a5a6',
  color: '#fff',
  padding: '0.75rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

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

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '12px',
  maxWidth: '400px',
  width: '100%',
};

const modalButtons: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginTop: '1rem',
};

const confirmDeleteButton: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#e74c3c',
  color: '#fff',
  padding: '0.75rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
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

const actionButtonsContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem',
  marginTop: '2rem',
  paddingTop: '1rem',
  borderTop: '1px solid #eee',
};

const resetButton: React.CSSProperties = {
  backgroundColor: '#3498db',
  color: '#fff',
  padding: '0.75rem 2rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const confirmResetButton: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#3498db',
  color: '#fff',
  padding: '0.75rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
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

export default EditUser; 