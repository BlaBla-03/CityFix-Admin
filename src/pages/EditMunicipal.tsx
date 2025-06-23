import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import Navbar from '../components/Navbar';

interface IncidentType {
  id: string;
  name: string;
}

interface MunicipalForm {
  name: string;
  address: string;
  postcodeRanges: { start: string; end: string }[];
  incidentTypes: string[];
}

const EditMunicipal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<MunicipalForm>({
    name: '',
    address: '',
    postcodeRanges: [{ start: '', end: '' }],
    incidentTypes: [],
  });
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'municipals', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            name: data.name || '',
            address: data.address || '',
            postcodeRanges: data.postcodeRanges
              ? data.postcodeRanges.map((r: any) => ({ start: String(r.start), end: String(r.end) }))
              : [{ start: '', end: '' }],
            incidentTypes: data.incidentTypes || [],
          });
        }
        // Fetch incident types
        const q = collection(db, 'incidentTypes');
        const snapshot = await getDocs(q);
        const types = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setIncidentTypes(types);
      } catch (err) {
        setError('Error fetching municipal data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRangeChange = (idx: number, field: 'start' | 'end', value: string) => {
    setForm(prev => ({
      ...prev,
      postcodeRanges: prev.postcodeRanges.map((range, i) =>
        i === idx ? { ...range, [field]: value } : range
      ),
    }));
  };

  const addRange = () => {
    setForm(prev => ({
      ...prev,
      postcodeRanges: [...prev.postcodeRanges, { start: '', end: '' }],
    }));
  };

  const removeRange = (idx: number) => {
    setForm(prev => ({
      ...prev,
      postcodeRanges: prev.postcodeRanges.filter((_, i) => i !== idx),
    }));
  };

  const handleIncidentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setForm(prev => ({
      ...prev,
      incidentTypes: checked
        ? [...prev.incidentTypes, value]
        : prev.incidentTypes.filter(type => type !== value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!form.name || !form.address || form.postcodeRanges.some(r => !r.start || !r.end)) {
        throw new Error('All fields are required');
      }
      for (const range of form.postcodeRanges) {
        if (Number(range.start) > Number(range.end)) {
          throw new Error('Start postcode must be less than end postcode');
        }
      }
      await updateDoc(doc(db, 'municipals', id!), {
        name: form.name,
        address: form.address,
        postcodeRanges: form.postcodeRanges.map(r => ({ start: Number(r.start), end: Number(r.end) })),
        incidentTypes: form.incidentTypes,
        updatedAt: new Date(),
      });
      alert('Municipal updated successfully!');
      navigate('/municipals');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'municipals', id!));
      alert('Municipal deleted successfully!');
      navigate('/municipals');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={pageContainer}>
        <Navbar />
        <main style={mainContent}>
          <div style={loadingContainer}>Loading municipal data...</div>
        </main>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <Navbar />
      <main style={mainContent}>
        <div style={contentContainer}>
          <div style={backButtonContainer}>
            <button style={backButton} onClick={() => navigate('/municipals')}>
              Back to Municipals
            </button>
          </div>
          <div style={card}>
            <h2 style={title}>Edit Municipal</h2>
            {error && <p style={errorText}>{error}</p>}
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={inputGroup}>
                <label style={label}>Municipal Name</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  style={input}
                  placeholder="Enter municipal name"
                  required
                />
              </div>
              <div style={inputGroup}>
                <label style={label}>Address</label>
                <input
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  style={input}
                  placeholder="Enter address"
                  required
                />
              </div>
              <div style={inputGroup}>
                <label style={label}>Postcode Range(s)</label>
                {form.postcodeRanges.map((range, idx) => (
                  <div style={postcodeRange} key={idx}>
                    <input
                      name={`postcodeStart${idx}`}
                      type="number"
                      value={range.start}
                      onChange={e => handleRangeChange(idx, 'start', e.target.value)}
                      style={input}
                      placeholder="Start"
                      required
                    />
                    <span style={rangeSeparator}>to</span>
                    <input
                      name={`postcodeEnd${idx}`}
                      type="number"
                      value={range.end}
                      onChange={e => handleRangeChange(idx, 'end', e.target.value)}
                      style={input}
                      placeholder="End"
                      required
                    />
                    {form.postcodeRanges.length > 1 && (
                      <button type="button" style={removeRangeButton} onClick={() => removeRange(idx)}>
                        &minus;
                      </button>
                    )}
                    {idx === form.postcodeRanges.length - 1 && (
                      <button type="button" style={addRangeButton} onClick={addRange}>
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div style={inputGroup}>
                <label style={label}>Incident Types</label>
                <div style={incidentTypesGrid}>
                  {incidentTypes.map((type) => (
                    <label key={type.id} style={incidentTypeLabel}>
                      <input
                        type="checkbox"
                        value={type.name}
                        checked={form.incidentTypes.includes(type.name)}
                        onChange={handleIncidentTypeChange}
                        style={checkbox}
                      />
                      {type.name}
                    </label>
                  ))}
                </div>
              </div>
              <div style={actionButtonsContainer}>
                <button type="submit" style={submitButton} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Municipal'}
                </button>
                <button type="button" style={cancelButton} onClick={() => navigate('/municipals')} disabled={loading}>
                  Cancel
                </button>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" style={deleteButton} onClick={() => setShowConfirm(true)} disabled={loading}>
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
        {showConfirm && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this municipal? This action cannot be undone.</p>
              <div style={modalButtons}>
                <button style={confirmDeleteButton} onClick={handleDelete} disabled={loading}>
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button style={cancelButton} onClick={() => setShowConfirm(false)} disabled={loading}>
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

const contentContainer: React.CSSProperties = {
  width: '100%',
  maxWidth: '900px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
};

const backButtonContainer: React.CSSProperties = {
  marginBottom: '1rem',
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

const postcodeRange: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '0.5rem',
};

const rangeSeparator: React.CSSProperties = {
  color: '#666',
  fontSize: '0.875rem',
};

const addRangeButton: React.CSSProperties = {
  marginLeft: '0.5rem',
  backgroundColor: '#2ecc71',
  color: '#fff',
  border: 'none',
  borderRadius: '50%',
  width: '2rem',
  height: '2rem',
  fontSize: '1.25rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const removeRangeButton: React.CSSProperties = {
  marginLeft: '0.5rem',
  backgroundColor: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: '50%',
  width: '2rem',
  height: '2rem',
  fontSize: '1.25rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const incidentTypesGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '1rem',
  marginTop: '0.5rem',
};

const incidentTypeLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.875rem',
  color: '#666',
};

const checkbox: React.CSSProperties = {
  width: '1rem',
  height: '1rem',
};

const actionButtonsContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem',
  marginTop: '2rem',
  paddingTop: '1rem',
  borderTop: '1px solid #eee',
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

export default EditMunicipal; 