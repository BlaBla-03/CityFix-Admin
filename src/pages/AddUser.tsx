import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import Navbar from '../components/Navbar';

interface Municipal {
  id: string;
  name: string;
  location: string;
}

const AddUser: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    location: '',
    municipal: '',
    role: 'staff',
  });
  const [municipals, setMunicipals] = useState<Municipal[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMunicipals = async () => {
      try {
        const q = collection(db, 'municipals');
        const snapshot = await getDocs(q);
        const municipalList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Municipal[];
        setMunicipals(municipalList);
      } catch (error) {
        console.error('Error fetching municipals:', error);
      }
    };

    fetchMunicipals();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (form.role === 'admin') {
      setShowConfirm(true);
      setLoading(false);
      return;
    }

    try {
      await createUser();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No user is currently signed in.");
      }
      const token = await currentUser.getIdToken();

      const response = await fetch('https://us-central1-city-fix-62029.cloudfunctions.net/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          location: form.location,
          municipal: form.municipal,
          role: form.role,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Failed to create user.');
      }

      const result = await response.json();
      setTempPassword(result.data.tempPassword);
      setShowTempPassword(true);
    } catch (error: any) {
      throw error;
    }
  };

  const confirmAdminCreation = async () => {
    setLoading(true);
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser || !currentUser.email) throw new Error('No current user');

      setShowConfirm(false);
      await createUser();
    } catch (error: any) {
      setError('Password confirmation failed: ' + error.message);
      setLoading(false);
    }
  };

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
            <h2 style={title}>Add New User</h2>
            
            {error && <p style={errorText}>{error}</p>}
            
            {showTempPassword ? (
              <div style={tempPasswordContainer}>
                <h3 style={tempPasswordTitle}>User Created Successfully!</h3>
                <p style={tempPasswordText}>
                  Temporary password for {form.email}: <strong>{tempPassword}</strong>
                </p>
                <p style={tempPasswordNote}>
                  Please save this password. The user will need it for their first login.
                </p>
                <button
                  style={submitButton}
                  onClick={() => navigate('/users')}
                >
                  Back to Users
                </button>
              </div>
            ) : (
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
                    {loading ? 'Creating User...' : 'Create User'}
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
              </form>
            )}
          </div>
        </div>

        {showConfirm && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>Confirm Admin Creation</h3>
              <p>Creating an admin user requires additional security verification. Please enter your password to continue.</p>
              <div style={modalForm}>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={input}
                  placeholder="Enter your password"
                  required
                />
                <div style={modalButtons}>
                  <button
                    style={confirmButton}
                    onClick={confirmAdminCreation}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Admin'}
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
  margin: 0,
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

const tempPasswordContainer: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '1.5rem',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
  textAlign: 'center',
};

const tempPasswordTitle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#000',
  marginBottom: '1rem',
};

const tempPasswordText: React.CSSProperties = {
  fontSize: '1rem',
  color: '#666',
  marginBottom: '0.5rem',
};

const tempPasswordNote: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#999',
  marginBottom: '1.5rem',
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const modalForm: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginTop: '1rem',
};

const modalButtons: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

const confirmButton: React.CSSProperties = {
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

export default AddUser; 